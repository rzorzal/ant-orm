class User extends ANT.Model {
    get columns(){
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER },
            nome: { type: ANT.TYPES.STRING }
        });
    }
}
