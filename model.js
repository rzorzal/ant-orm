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
