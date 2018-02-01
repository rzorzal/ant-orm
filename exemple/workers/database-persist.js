onmessage = async function(e){

    let model = e.data.model;
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

    dbPromise.onsuccess = function(){
        let DB = dbPromise.result;
        let TX = DB.transaction(modelName, 'readwrite')
        let TABLE = TX.objectStore(modelName);
        let storeRequest;
        if(model['ANTID']){
            storeRequest = TABLE.put(model);
        } else{
            delete model['ANTID'];
            storeRequest = TABLE.add(model);
        }


        TX.oncomplete = function(e){
            postMessage({
                ANTID: storeRequest.result,
                success: true
            });
        }


    }

}
