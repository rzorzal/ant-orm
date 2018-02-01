onmessage = async function(e){

    let models = e.data.models;
    let databaseName = e.data.databaseName;
    let version = e.data.version;

    if (!('indexedDB' in this)) {
        console.console.error();('This browser doesn\'t support IndexedDB');
        postMessage({
            error: new Error("This browser doesn\'t support IndexedDB")
        });
        return;
    }

    let dbPromise = indexedDB.open(databaseName, version);

    dbPromise.onupgradeneeded = function(event){
        let DB = event.target.result;
        for(let modelsDefinition of models){
            if (!DB.objectStoreNames.contains(modelsDefinition.modelName)) {
                let table = DB.createObjectStore(modelsDefinition.modelName, {keyPath: 'ANTID', autoIncrement: true});
                for(let columnName in modelsDefinition.columns){
                    if (columnName == 'ANTID') continue;
                    let columnsDefinition = modelsDefinition.columns[columnName];
                    table.createIndex(columnName, columnName, {unique: columnsDefinition.unique});
                }
            }
        }


    }

    dbPromise.onsuccess = function(){
        postMessage({
            success: true,
        });
    }

}
