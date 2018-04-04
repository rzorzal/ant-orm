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
let pipeFunctions = require("./utils/pipe-functions.js");

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

        pipeFunctions(this.constructor.beforeBulk,[data], this);

        for(let columnName in columns){
            let columnsDefinition = columns[columnName];
            let defaultValue = columnsDefinition.defaultValue?TYPES.convert(columnsDefinition.defaultValue, columnsDefinition.type):null;
            this[columnName] = data[columnName] ? TYPES.convert(data[columnName], columnsDefinition.type) : defaultValue;
        }

        pipeFunctions(this.constructor.afterBulk,[data], this);
    }

    toJSON(){
        let data = {};
        for(let columnsName in this.columns){
            data[columnsName] = this[columnsName];
        }
        return data;
    }

    async persist(){
        //beforePersist
        pipeFunctions(this.constructor.beforePersist,[], this);

        let result = await persistFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            model: this,
            modelName: this.constructor.name
        });

        //afterPersist
        pipeFunctions(this.constructor.afterPersist,[result], this);

        return result;
    }

    async destroy(){
        //beforeDelete;
        pipeFunctions(this.constructor.beforeDelete,[], this);

        let result = await destroyFunction({
            databaseName: ANT.databaseName,
            version: ANT.version,
            workersPath: ANT.workersPath,
            model: this,
            modelName: this.constructor.name
        });
        //afterDelete
        pipeFunctions(this.constructor.afterDelete,[result], this);

        return result;
    }

    async update(data){
        //beforeUpdate
        pipeFunctions(this.constructor.beforeUpdate,[data], this);

        for(let attributeName in data){
            this[attributeName] = data[attributeName];
        }
        let result = await this.persist();
        //afterUpdate
        pipeFunctions(this.constructor.afterUpdate,[result], this);

        return this;
    }

    static async create(data){
        //beforeCreate
        pipeFunctions(this.constructor.beforeCreate,[data], this);

        let instance = new this(data);
        let result = await instance.persist();
        instance['ANTID'] = result.ANTID;
        //afterCreate
        pipeFunctions(this.constructor.afterCreate,[result], this);

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

    //HOOKS DEFINITION

    static get beforeCreate(){
        return [];
    }

    static get beforeUpdate(){
        return [];
    }

    static get beforeBulk(){
        return [];
    }

    static get beforeDelete(){
        return [];
    }

    static get beforePersist(){
        return [];
    }

    static get afterCreate(){
        return [];
    }

    static get afterUpdate(){
        return [];
    }

    static get afterBulk(){
        return [];
    }

    static get afterDelete(){
        return [];
    }

    static get afterPersist(){
        return [];
    }

}

module.exports = Model;

},{"./functions/destroy.js":2,"./functions/persist.js":4,"./functions/query.js":5,"./types.js":8,"./utils/pipe-functions.js":9}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
module.exports = function(functions, argumentsList, ctx){
    if(!ctx) ctx = window;
    let results = functions.map(f => f.apply(ctx, argumentsList));
    return results;
}

},{}]},{},[6]);
