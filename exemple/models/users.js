class User extends ANT.Model {
    get columns(){
        return this.setColumns({
            id: { type: ANT.TYPES.NUMBER },
            foto: { type: ANT.TYPES.STRING },
            nome: { type: ANT.TYPES.STRING }
        });
    }
}
