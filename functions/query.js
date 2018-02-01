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
