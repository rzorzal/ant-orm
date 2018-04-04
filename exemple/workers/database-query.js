const STRATEGIES = {
    LOGICAL: {
        LIST: {
            "$and": function(list1, list2){
                let result = [];
                for(let obj of list1){
                    let has = list2.find(function(obj2){
                        return obj['ANTID'] == obj2['ANTID']
                    });
                    if(has){
                        result.push(obj);
                    }
                }
                return result;
            },
            "$or": function(list1, list2){
                let result = [];
                for(let obj of list1){
                    let has = result.find(function(obj2){
                        return obj['ANTID'] == obj2['ANTID']
                    });
                    if(!has){
                        result.push(obj);
                    }
                }
                for(let obj of list2){
                    let has = result.find(function(obj2){
                        return obj['ANTID'] == obj2['ANTID']
                    });
                    if(!has){
                        result.push(obj);
                    }
                }
                return result;
            },
            "$xor": function(list1, list2){
                //não deve pegar a INTERSEÇÃO

                //INTERSEÇÃO
                let intersection = STRATEGIES.LOGICAL.LIST['$and'](list1, list2);

                let elements1 = list1.filter(l1 => !intersection.find(i => i['ANTID'] == l1['ANTID']));
                let elements2 = list2.filter(l2 => !intersection.find(i => i['ANTID'] == l2['ANTID']));

                let result = [...elements1, ...elements2];

                return result;
            }
        },
        OBJECT: {
            "$eq": function(value){
                return IDBKeyRange.only(value);
            },
            "$ne": function(value){
                return function(object, key){
                    return value != object[key];
                }
            },
            "$gt": function(value){
                return IDBKeyRange.lowerBound(value, true);
            },
            "$gte": function(value){
                return IDBKeyRange.lowerBound(value);
            },
            "$lt": function(value){
                return IDBKeyRange.upperBound(value, true);
            },
            "$lte": function(value){
                return IDBKeyRange.upperBound(value);
            },
            "$btw": function(value){
                return IDBKeyRange.bound(value[0], value[1], true, false);
            },
            "$btwe": function(value){
                return IDBKeyRange.bound(value[0], value[1]);
            },
            "$in": function(value){
                return function(object, key){
                    return !!value.some(function(v){
                        return v == object[key];
                    });
                }
            },
            "$like": function(value){
                return function(object, key){
                    return object[key].indexOf(value) !== -1;
                }
            },
            "$notLike": function(value){
                return function(object, key){
                    return object[key].indexOf(value) === -1;
                }
            }
        }
    },
    ARITHMETIC:{
        "ignoreCase": function(value){
            return value.toString().toUpperCase();
        }
    }
}

function getStrategyFunction(strategyName){
    if(STRATEGIES.LOGICAL.LIST.hasOwnProperty(strategyName)){
        return STRATEGIES.LOGICAL.LIST[strategyName];
    } else if(STRATEGIES.LOGICAL.OBJECT.hasOwnProperty(strategyName)){
        return STRATEGIES.LOGICAL.OBJECT[strategyName];
    } else if(STRATEGIES.ARITHMETIC.hasOwnProperty(strategyName)){
        return STRATEGIES.ARITHMETIC[strategyName];
    }
}

function mergeResults(results, mergeOperator){
    if(!mergeOperator){
        mergeOperator = STRATEGIES.LOGICAL.LIST["$and"];
    }
    if(!results.length){
        return [];
    }
    if(results.length == 1){
        return results[0];
    }
    let mergedResult;
    for(let result of results){
        if(!mergedResult){
            mergedResult = result;
            continue;
        }
        mergedResult = mergeOperator(mergedResult, result);
    }
    return mergedResult;
}

function executeQuery(TABLE, queryOBJ, mergeOperator){
    return new Promise(function(resolve, reject){
        let results = [];
        let countNumberOfExpressions = 0;
        let countNumberOfExpressionsTerminateds = 0;


        let onsuccess = function(filterFunction, keyObject){
            let resultExpression = [];
            return async function(event){
                let cursor = event.target.result;
                if(cursor){
                    if(filterFunction){
                        let passed = await filterFunction(cursor.value, keyObject);
                        if(passed){
                            resultExpression.push(cursor.value);
                        }
                    } else {
                        resultExpression.push(cursor.value);
                    }

                    cursor.continue();
                } else {
                    results.push(resultExpression);
                    countNumberOfExpressionsTerminateds++;
                    if(countNumberOfExpressionsTerminateds === countNumberOfExpressions){
                        let resultsMergeds = mergeResults(results, mergeOperator);
                        resolve(resultsMergeds);
                    }
                }
            }
        }


        for(let expression in queryOBJ){
            if(TABLE.indexNames.contains(expression)){

                let INDEX = TABLE.index(expression);
                if(typeof queryOBJ[expression] === "object"){
                    let objectExpression = queryOBJ[expression];
                    for(let strategyName in objectExpression){
                        countNumberOfExpressions++;
                        let value = objectExpression[strategyName];
                        let strategy = getStrategyFunction(strategyName);
                        if(strategy){
                            let KEYRANGE = strategy(value);
                            let iterator;
                            if(typeof KEYRANGE === "function"){
                                iterator = INDEX.openCursor();
                                iterator.onsuccess = onsuccess(KEYRANGE, expression);
                            } else if(typeof KEYRANGE === "object"){
                                iterator = INDEX.openCursor(KEYRANGE);
                                iterator.onsuccess = onsuccess();
                            }
                            iterator.onerror = function(){
                                reject(arguments);
                            }
                        }
                    }
                } else {
                    countNumberOfExpressions++;
                    let KEYRANGE = IDBKeyRange.only(queryOBJ[expression]);
                    INDEX.openCursor(KEYRANGE).onsuccess = onsuccess();
                    INDEX.openCursor(KEYRANGE).onerror = function(){
                        reject(arguments);
                    }
                }
            } else {
                //CASO SEJA UM AND, OR, XOR
                let strategy = getStrategyFunction(expression);
                if(strategy){
                    return executeQuery(TABLE, queryOBJ[expression], strategy).then(resolve).catch(reject);
                }
            }


        }
    });

}


onmessage = async function(e){

    let query = e.data.query;
    let databaseName = e.data.databaseName;
    let version = e.data.version;
    let modelName = e.data.modelName

    if (!('indexedDB' in this)) {
        console.console.error();('This browser doesn\'t support IndexedDB');
        postMessage({
            error: new Error("This browser doesn\'t support IndexedDB")
        });
        return;
    }

    let dbPromise = indexedDB.open(databaseName, version);

    dbPromise.onsuccess = async function(){
        let DB = dbPromise.result;
        let TX = DB.transaction(modelName, 'readwrite')
        let TABLE = TX.objectStore(modelName);

        let result = await executeQuery(TABLE, query);

        TX.oncomplete = function(e){
            postMessage({
                result: result,
                success: true
            });
        }


    }

}
