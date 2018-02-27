(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = async function({databaseName, models, workersPath, version}){
    return new Promise(function(resolve, reject){
        let worker = new Worker(workersPath + "/database-create.js");


        worker.onmessage = function(e) {
            resolve(e.data);
            worker.terminate();
        };

        worker.postMessage({
            databaseName: databaseName,
            models: models,
            version: version
        });
    });


}

},{}],2:[function(require,module,exports){
module.exports = async function({databaseName, model, modelName, workersPath, version}){
    return new Promise(function(resolve, reject){
        let worker = new Worker(workersPath + "/database-destroy.js");


        worker.onmessage = function(e) {
            resolve(e.data);
            worker.terminate();
        };

        worker.postMessage({
            databaseName: databaseName,
            model: model.toJSON(),
            modelName: modelName,
            version: version
        });
    });


}

},{}],3:[function(require,module,exports){

var createDataBase = require('../functions/createDatabase.js')

module.exports = async function({databaseName, workersPath, modelsPaths, version}){
    ANT.workersPath = workersPath;
    ANT.databaseName = databaseName;
    ANT.version = version;

    let modelsDefinition = [];

    for(let modelsName in modelsPaths){
        let sourceURL = modelsPaths[modelsName];
        let fecthedData = await fetch(window.location.origin + sourceURL,{
			credentials: 'include'
		});
		let modelDefinition = await fecthedData.text();
        let modelDefinitionConcated = modelDefinition.concat(`//@ sourceURL=http://ANT_MODELS${sourceURL}`);
        let functionDefinition = new Function("return ".concat(modelDefinitionConcated));
        let modelClass = functionDefinition();
        ANT[modelsName] = modelClass;
        modelsDefinition.push({
            modelName: modelsName,
            columns: ANT[modelsName].prototype.columns
        });

    }

    await createDataBase({
        databaseName: databaseName,
        workersPath: workersPath,
        version: version,
        models: modelsDefinition
    });



}

},{"../functions/createDatabase.js":1}],4:[function(require,module,exports){
module.exports = async function({databaseName, model, modelName, workersPath, version}){
    return new Promise(function(resolve, reject){
        let worker = new Worker(workersPath + "/database-persist.js");


        worker.onmessage = function(e) {
            resolve(e.data);
            worker.terminate();
        };

        worker.postMessage({
            databaseName: databaseName,
            model: model.toJSON(),
            modelName: modelName,
            version: version
        });
    });


}

},{}],5:[function(require,module,exports){
module.exports = async function({databaseName, query, modelName, workersPath, version}){
    return new Promise(function(resolve, reject){
        let worker = new Worker(workersPath + "/database-query.js");


        worker.onmessage = function(e) {
            resolve(e.data);
            worker.terminate();
        };

        worker.postMessage({
            databaseName: databaseName,
            query: query,
            modelName: modelName,
            version: version
        });
    });


}

},{}],6:[function(require,module,exports){
ANT = {
    Model: require("./model.js"),
    TYPES: require("./types.js"),
    init: require("./functions/init.js")
}

},{"./functions/init.js":3,"./model.js":7,"./types.js":8}],7:[function(require,module,exports){
const TYPES = require("./types.js");
const persistFunction = require("./functions/persist.js");
const destroyFunction = require("./functions/destroy.js");
const queryFunction = require("./functions/query.js");

class Model {

    setColumns(columnsDefinition){
        this.columnsDefinition = {};
        for(let columnsName in columnsDefinition){
            this.columnsDefinition[columnsName] = columnsDefinition[columnsName];
        }
        this.columnsDefinition.ANTID = { type: TYPES.NUMBER, primary: true, uniq: true, defaultValue: null };
        return this.columnsDefinition;
    }

    get columns(){
        if(!this.columnsDefinition){
            this.columnsDefinition.ANTID = { type: TYPES.NUMBER, primary: true, unique: true, defaultValue: null };
        }
        return this.columnsDefinition;
    }

    constructor(){
        let columns = this.columns;
        let data = {};

        if(arguments.length){
            data = arguments[0];
        }

        for(let columnName in columns){
            let columnsDefinition = columns[columnName];
            let defaultValue = columnsDefinition.defaultValue?TYPES.convert(columnsDefinition.defaultValue, columnsDefinition.type):null;
            this[columnName] = data[columnName] ? TYPES.convert(data[columnName], columnsDefinition.type) : defaultValue;
        }
    }

    toJSON(){
        let data = {};
        for(let columnsName in this.columns){
            data[columnsName] = this[columnsName];
        }
        return data;
    }

    async persist(){
        return await persistFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            model: this,
            modelName: this.constructor.name
        });
    }

    async destroy(){
        return await destroyFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            model: this,
            modelName: this.constructor.name
        })
    }

    async update(data){
        for(let attributeName in data){
            this[attributeName] = data[attributeName];
        }
        let result = await this.persist();
        return this;
    }

    static async create(data){
        let instance = new this(data);
        let result = await instance.persist();
        instance['ANTID'] = result.ANTID;
        return instance;
    }

    static async findAll(query){
        let models = [];
        let response = await queryFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            modelName: this.name,
            query: query
        });
        if(response.success){
            let results = response.result;
            for(let result of results){
                models.push(new this(result));
            }
        } else {
            throw new Error("Error on executing query");
        }
        return models;
    }

    static async findOne(query){
        let response = await queryFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            modelName: this.name,
            query: query
        });
        if(response.success){
            let results = response.result;
            if(results[0]){
                return results[0];
            }
        } else {
            throw new Error("Error on executing query");
        }
    }



}

module.exports = Model;

},{"./functions/destroy.js":2,"./functions/persist.js":4,"./functions/query.js":5,"./types.js":8}],8:[function(require,module,exports){
const TYPES = {
    NUMBER: "number",
    STRING: "string",
    BOOL: "bool",
    DATE: "date",
    convert: function(data, type){
        if(type == this.NUMBER){
            return parseFloat(data);
        }

        if(type == this.STRING){
            if(typeof data === "undefined"){
                return undefined;
            }
            if(data === null){
                return null;
            }
            return (new String(data)).toString();
        }

        if(type == this.BOOL){
            return !!data;
        }


        if(type == this.DATE){
            if(typeof data === "undefined"){
                return undefined;
            }
            if(data === null) return null;
            return new Date(data);
        }

        return data;
    }
}

module.exports = TYPES;

},{}]},{},[6]);
