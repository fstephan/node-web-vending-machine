xdescribe('Browser', ()=> {
    beforeAll((done)=>{
        window.alert();
        jasmine.getFixtures().fixturesPath = "."; 
        jasmine.getFixtures().preload('index.html');
        //Promise.resolve(readFixtures('index.html')); 
        setTimeout(done, 3000);
    })
    it('should have access to message', ()=> {
        
        expect(messageEl).toBe('hello');
    })
})