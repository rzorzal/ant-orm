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
