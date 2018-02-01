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
