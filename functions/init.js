
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
