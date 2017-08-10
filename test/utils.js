describe('utils', () => {

  describe('stringify', () => {

    const lib = require('../lib/utils')

    it('stringifies an object', () => {
      const object = { answer: 42 }
      lib.stringify(object).should.equal(JSON.stringify(object, null, '  '))
    })

    it('stringifies an Error istance', () => {
      const error = new Error('uh-oh'),
            result = JSON.parse(lib.stringify(error))
      result.message.should.equal('uh-oh')
      result.stack.should.be.an.instanceOf(String)
    });

  })

})

