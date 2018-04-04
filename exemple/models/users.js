class User extends ANT.Model {
    get columns(){
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER },
            foto: { type: ANT.TYPES.STRING },
            nome: { type: ANT.TYPES.STRING },
            createdAt: { type: ANT.TYPES.DATE, get defaultValue(){ return new Date() } }
        });
    }

    static get afterBulk(){
        return [
            User.logHook
        ]
    }

    static get beforeBulk(){
        return [
            this.logHook
        ]
    }

    static logHook(){
        console.log(arguments);
        console.log(this);
    }

}
