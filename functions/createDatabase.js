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
