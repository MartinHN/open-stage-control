var WolfyEventEmitter = require('wolfy87-eventemitter'),
    customEvents = {}

customEvents['draginit'] = customEvents['drag'] = customEvents['dragend']  = require('./drag')
customEvents['resize']  = require('./resize')

module.exports = class EventEmitter extends WolfyEventEmitter {

    constructor() {

        super()

        this._customBindings = {}
        this._contextEvents = {}

        for (var evt in customEvents) {
            this._customBindings[evt] = {
                bindings: 0
            }
        }

    }

    emitEvent(evt, args) {

        // Event bubbling

        super.emitEvent(evt, args)

        if (args[0] && !args[0].stopPropagation) {
            if (this.parent) this.parent.emitEvent(evt, args)
        }

        return this

    }

    addListener(evt, listener, options) {

        // Custom event setup

        if (
            customEvents.hasOwnProperty(evt) &&
            typeof customEvents[evt].setup === 'function'
        ) {
            if (this._customBindings[evt].bindings === 0) {
                this._customBindings[evt].options = options
                customEvents[evt].setup.call(this, options)
            }
            this._customBindings[evt].bindings += 1
        }

        if (options && options.context) {
            var hash = options.context.hash
            if (!this._contextEvents[hash]) this._contextEvents[hash] = []
            this._contextEvents[hash].push([evt, listener])
        }

        super.addListener(evt, listener)

        return this

    }

    removeListener(evt, listener) {

        // Custom event teardown

        if (
            customEvents.hasOwnProperty(evt) &&
            typeof customEvents[evt].teardown === 'function' &&
            this._customBindings[evt].bindings !== 0
        ) {
            this._customBindings[evt].bindings -= 1
            if (this._customBindings[evt].bindings === 0 || !listener) {
                var options = this._customBindings[evt].options
                customEvents[evt].teardown.call(this, options)
            }
        }

        // Remove all listeners is none specified

        if (listener) {

            super.removeListener(evt, listener)

        } else {

            this.removeEvent(evt)

        }

        return this

    }

    removeEventContext(context,evt) {

        var events = this._contextEvents[context.hash]

        if (events) {
            for (var i = 0; i < events.length; i++) {
                if(!evt || events[i][0]==evt){
                    this.removeListener(events[i][0], events[i][1])
                }
            }
            if(this._contextEvents[context.hash].length==0) delete this._contextEvents[context.hash]
        }

    }

}
