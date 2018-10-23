describe('utils', function () {

  describe('stringify', function () {

    const lib = require('../lib/utils')

    it('stringifies an object', function () {
      const object = { answer: 42 }
      lib.stringify(object).should.equal(JSON.stringify(object, null, '  '))
    })

    it('stringifies an Error istance', function () {
      const error = new Error('uh-oh'),
        result = JSON.parse(lib.stringify(error))
      result.message.should.equal('uh-oh')
      result.stack.should.be.an.instanceOf(String)
    });

    it('handles circular objects', function () {
      const circular = {}
      const child = { circular }
      circular.child = child

      const stringify = () => {
        lib.stringify(circular)
      }

      stringify.should.not.throw()
    })
  })

})

