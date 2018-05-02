const Penner = require('penner')
const moment = require('moment')
const Events = require('eventemitter3')

const utils = require('./utils')
let defaults = require('./defaults')

class Drawer extends Events
{
    /**
     * @param {object} [options]
     * @param {HTMLElement} [options.parent=document.body] where to attach the drawer
     * @param {boolean} [options.auto=true] automatically open and close the drawer based on acceleration or click
     * @param {string} [options.side=left] (left, right, top, or bottom)
     * @param {number} [options.size] size (in pixels) of opened drawer
     * @param {number} [options.barSize=20] size (in pixels) of drag bar
     * @param {boolean} [options.full=true] whether the drawer should take up the full width or height
     * @param {boolean} [options.open] start with drawer open
     * @param {boolean} [options.noInteraction] open drawer only programmatically
     * @param {object} [options.styles] styles for div
     * @param {string} [options.className] class name for div
     * @param {string} [options.barBackground=rgba(0,0,0,0.25)] background setting for drag bar
     * @param {string} [options.ease=easeInOutSine] ease for animated opening
     * @param {number} [options.duration=500] animate time for opening drawer on click
     * @param {number} [options.threshold=10] number of pixels before move starts
     * @param {number} [options.timeRecent=100] maximum time in milliseconds to use when calculating acceleration
     * @param {number} [options.minVelocty=0.5] minimum velocity (pixels/millisecond) for opening and closing after a drag
     * @param {string} [options.content] HTML content for the drawer
     * @param {object} [options.contentStyles] styles for content of drawer
     * @fires opening
     * @fires closing
     * @fires opened
     * @fires closed
     * @fires location
     */
    constructor(options)
    {
        super()
        this.options = utils.options(options, Drawer._defaults)
        this._size = this.options.size
        this._barSize = this.options.barSize
        this.ease = this.options.ease ? (typeof this.options.ease === 'function' ? this.options.ease : Penner[this.options.ease]) : Penner['easeInOutSine']
        this.all = ['left', 'right', 'top', 'bottom']

        /**
         * minimum velocity (pixels/millisecond) for opening and closing after a drag
         * @type (number)
         */
        this.minVelocity = this.options.minVelocity

        /**
         * maximum time in milliseconds to use when calculating acceleration
         * @type {number}
         */
        this.timeRecent = this.options.timeRecent

        /**
         * automatically open and close the drawer based on acceleration or click
         * @type {boolean}
         */
        this.auto = this.options.auto

        /**
         * number of pixels before move starts after a mousedown or touchstart
         * @type {number}
         */
        this.threshold = this.options.threshold

        /**
         * animate time for opening drawer on click
         * @type {number}
         **/
        this.duration = this.options.duration

        /**
         * Main drawer element
         * @type {HTMLElement}
         */
        this.div = utils.html({
            parent: this.options.parent,
            defaultStyles: {
                'position': 'fixed',
                'background': 'white'
            },
            styles: this.options.styles
        })

        /**
         * use this to add content to the div
         * @type {HTMLElement}
         */
        this.content = utils.html({ parent: this.div, styles: options.contentStyles, html: options.content })

        if (this.options.className)
        {
            this.div.className = this.options.className
        }

        /**
         * Bar drawer element
         * @type {HTMLElement}
         */
        this.bar = utils.html({
            parent: this.options.parent,
            styles: {
                'position': 'fixed',
                'background': this.options.barBackground || 'rgba(0,0,0,0.15)',
                'cursor': ['drag', '-webkit-grab', 'pointer']
            }
        })
        if (!this.options.noInteraction)
        {
            this._addListeners()
        }
        else
        {
            this.bar.style.display = 'none'
        }
        this._side = this.options.side
        this.vertical = this.side === 'left' || this.side === 'right'
        this._setSide(true)
        switch (this.side)
        {
            case 'left':
                this._location = this.div.offsetLeft
                break
            case 'right':
                this._location = this.div.parentNode.offsetWidth - (this.div.offsetLeft + this.div.offsetWidth)
                break
            case 'top':
                this._location = this.div.offsetTop
                break
            case 'bottom':
                this._location = window.innerHeight - (this.div.offsetTop + this.div.offsetHeight)
                break
        }
        if (this.options.open)
        {
            this.open(true)
        }
    }

    /**
     * call this when the contents of the drawer are updated
     */
    update()
    {
        this._setSide(true)
    }

    get side()
    {
        return this._side
    }
    set side(value)
    {
        if (this._side !== value)
        {
            this._side = value
            this.vertical = value === 'left' || value === 'right'
            this._setSide()
            if (this.opened)
            {
                this.open(true)
            }
        }
    }

    get size()
    {
        if (this._size)
        {
            return this._size
        }
        else
        {
            if (this.side === 'left' || this.side === 'right')
            {
                return this.div.offsetWidth
            }
            else
            {
                return this.div.offsetHeight
            }
        }
    }
    set size(value)
    {
        this._size = value
        this._setSide(true)
        if (this.opened)
        {
            this.open(false)
        }
    }

    get barSize()
    {
        return this._barSize
    }
    set barSize(value)
    {
        this._barSize = value
        this._setSide(true)
        if (this.opened)
        {
            this.open(false)
        }
    }

    /**
     * change top value of drawer
     * @type {number}
     */
    get top()
    {
        return this.div.style.top
    }
    set top(value)
    {
        this.div.style.top = this.bar.style.top = value
    }

    /**
     * change left value of drawer
     * @type {number}
     */
    get left()
    {
        return this.div.style.left
    }
    set left(value)
    {
        this.div.style.left = this.bar.style.left = value
    }

    /**
     * change bottom value of drawer
     * @type {number}
     */
    get bottom()
    {
        return this.div.style.bottom
    }
    set bottom(value)
    {
        this.div.style.bottom = this.bar.style.bottom = value
    }

    /**
     * change right value of drawer
     * @type {number}
     */
    get right()
    {
        return this.div.style.right
    }
    set right(value)
    {
        this.div.style.right = this.bar.style.right = value
    }

    _setSide(noReset)
    {
        if (!noReset)
        {
            for (let side of this.all)
            {
                if (side !== this.side)
                {
                    this.div.style[side] = 'unset'
                    this.bar.style[side] = 'unset'
                }
            }
        }
        if (this.vertical)
        {
            this.div.style.width = this._size ? this._size + 'px' : 'auto'
            this.bar.style.width = this.barSize + 'px'
            if (this.opened)
            {
                this.div.style[this._side] = 0
                this.bar.style[this._side] = this.div.offsetWidth + 'px'
            }
            else
            {
                this.div.style[this._side] = -this.size + 'px'
                this.bar.style[this._side] = 0
            }
            if (this.options.full)
            {
                this.div.style.top = this.bar.style.top = 0
                this.div.style.height = this.bar.style.height = '100vh'
            }
            else
            {
                this.bar.style.height = this.div.offsetHeight + 'px'
                this.bar.style.top = this.div.offsetTop + 'px'
            }
        }
        else
        {
            this.div.style.height = this._size ? this._size + 'px' : 'auto'
            this.bar.style.height = this.barSize + 'px'
            if (this.opened)
            {
                this.div.style[this._side] = 0
                this.bar.style[this._side] = this.div.offsetHeight + 'px'
            }
            else
            {
                this.div.style[this._side] = -this.size + 'px'
                this.bar.style[this._side] = 0
            }
            if (this.options.full)
            {
                this.div.style.left = this.bar.style.left = 0
                this.div.style.width = this.bar.style.width = '100vw'
            }
            else
            {
                this.bar.style.width = this.div.offsetWidth + 'px'
                this.bar.style.left = this.div.offsetLeft + 'px'
            }
        }
        if (this.opened)
        {
            this.open(true)
        }
        else
        {
            this.close(true)
        }
    }

    _addListeners()
    {
        this.bar.addEventListener('mousedown', (e) => this._down(e))
        this.bar.addEventListener('touchstart', (e) => this._down(e))
        this.bar.addEventListener('mousemove', (e) => this._move(e), { passive: false })
        this.bar.addEventListener('touchmove', (e) => this._move(e), { passive: false })
        document.body.addEventListener('mousemove', (e) => this._move(e), { passive: false })
        document.body.addEventListener('touchmove', (e) => this._move(e), { passive: false })
        this.bar.addEventListener('mouseup', (e) => this._up(e))
        this.bar.addEventListener('touchend', (e) => this._up(e))
        document.body.addEventListener('mouseup', (e) => this._up(e))
        document.body.addEventListener('mouseleave', (e) => this._up(e))
        document.body.addEventListener('touchend', (e) => this._up(e))
    }

    _down(e)
    {
        this.down = { x: e.pageX, y: e.pageY }
        this.changes = []
        this.moving = false
        if (this.bar.style.cursor === 'grab' || this.bar.style.cursor === '-webkit-grab')
        {
            utils.styles(this.bar, { 'cursor': ['grabbing', '-webkit-grabbing' ]})
        }
        e.preventDefault()
    }

    _checkThreshold(e)
    {
        if (!this.moving)
        {
            if (this.side === 'left' || this.side === 'right')
            {
                if (Math.abs(e.pageX - this.down.x) >= this.threshold)
                {
                    this.moving = true
                    return true
                }
                else
                {
                    return false
                }
            }
            else
            {
                if (Math.abs(e.pageY - this.down.y) >= this.threshold)
                {
                    this.moving = true
                    return true
                }
                else
                {
                    return false
                }
            }
        }
        else
        {
            return true
        }
    }

    _move(e)
    {
        if (this.down && this._checkThreshold(e))
        {
            let value
            if (this.vertical)
            {
                if (this.side === 'left')
                {
                    value = e.pageX - this.barSize / 2
                }
                else
                {
                    value = window.innerWidth - e.pageX + this.barSize / 2
                }
            }
            else
            {
                if (this.side === 'top')
                {
                    value = e.pageY - this.barSize / 2
                }
                else
                {
                    value = window.innerHeight - e.pageY + this.barSize / 2
                }
            }
            value -= this.size
            value = value > 0 ? 0 : value
            value = value < -this.size ? -this.size : value
            this.location = value
            this.changes.push({ value, time: moment() })
            e.preventDefault()
        }
    }

    /**
     * location of the drawer relative to the edge
     * @type {number}
     */
    get location()
    {
        return this._location
    }
    set location(value)
    {
        if (this._location !== value)
        {
            this.div.style[this.side] = value + 'px'
            this.bar.style[this.side] = value + this.size + 'px'
            this._location = value
            if (value === 0)
            {
                this.opened = true
                this.emit('opened', this)
            }
            else if (value === -this.size)
            {
                this.opened = false
                this.emit('closed', this)
            }
            this.emit('location', value, this)
        }
    }

    _getVelocity()
    {
        const now = moment()
        let current = this.changes[this.changes.length - 1]
        for (let i = this.changes.length - 2; i >= 0; i--)
        {
            if (now.diff(this.changes[i].time) > this.timeRecent)
            {
                i = i < this.changes.length - 1 ? i + 1 : i
                break
            }
            else
            {
                current = this.changes[i]
            }
        }
        const last = this.changes[this.changes.length - 1]
        const deltaDistance = current.value - last.value
        const deltaTime = current.time.diff(last.time)
        return deltaDistance / deltaTime
    }

    _up()
    {
        if (this.down)
        {
            if (!this.moving)
            {
                this.toggle()
            }
            else if (this.auto)
            {
                if (this.changes.length > 2)
                {
                    let velocity = this._getVelocity()
                    if (velocity === 0)
                    {
                        this._forceToggle()
                    }
                    else
                    {
                        if (Math.abs(velocity) < this.minVelocity)
                        {
                            velocity = this.minVelocity * (velocity < 0 ? -1 : 1)
                        }
                        if (velocity > 0)
                        {
                            this._openAnimate(velocity)
                        }
                        else
                        {
                            this._closeAnimate(velocity)
                        }
                    }
                }
                else
                {
                    this._forceToggle()
                }
            }
            if (this.bar.style.cursor === 'grabbing' || this.bar.style.cursor === '-webkit-grabbing')
            {
                utils.styles(this.bar, { 'cursor': ['grab', '-webkit-grab'] })
            }
            this.down = false
        }
    }

    _forceToggle()
    {
        if (this.div.offsetWidth > this.size / 2)
        {
            this.open()
        }
        else
        {
            this.close()
        }
    }

    /**
     * toggle the drawer (close if open, and open if closed)
     * @param {boolean} [noAnimate] do not animate
     */
    toggle(noAnimate)
    {
        if (this.opened)
        {
            this.close(noAnimate)
        }
        else
        {
            this.open(noAnimate)
        }
    }

    /**
     * open the drawer
     * @param {boolean} [noAnimate]
     */
    open(noAnimate)
    {
        if (this.down || !this.opened)
        {
            this.easing = null
            if (noAnimate)
            {
                this.div.style[this.side] = 0
                this.bar.style[this.side] = this.size + 'px'
                this.emit('opened', this)
            }
            else
            {
                this._openAnimate()
                this.emit('opening', this)
            }
            this.opened = true
        }
    }

    _openAnimate(velocity)
    {
        const duration = velocity ? Math.abs(0 - this.size) / velocity : this.duration
        this.easing = { start: this.location, end: 0, time: moment(), ease: velocity ? Penner.linear : this.ease, duration, type: 'open' }
        requestAnimationFrame(() => this.update())
    }

    /**
     * close the drawer
     * @param {boolean} [noAnimate]
     */
    close(noAnimate)
    {
        if (this.down || this.opened)
        {
            this.easing = null
            if (noAnimate)
            {
                this.div.style[this.side] = -this.size + 'px'
                this.bar.style[this.side] = 0
                this.emit('closed', this)
            }
            else
            {
                this._closeAnimate()
                this.emit('closing', this)
            }
            this.opened = false
        }
    }

    _closeAnimate(velocity)
    {
        const start = this.location
        const duration = velocity ? Math.abs((start - this.size) / velocity) : this.duration
        this.easing = { start, end: -this.size, time: moment(), ease: velocity ? Penner.linear : this.ease, duration, type: 'close' }
        requestAnimationFrame(() => this.update())
    }

    update()
    {
        if (this.easing)
        {
            let duration = moment().diff(this.easing.time)
            duration = duration > this.easing.duration ? this.easing.duration : duration
            this.location = this.ease(duration, this.easing.start, this.easing.end - this.easing.start, this.easing.duration)
            if (duration === this.easing.duration)
            {
                if (this.easing.type === 'open')
                {
                    this.emit('opened', this)
                }
                else
                {
                    this.emit('closed', this)
                }
                this.easing = null
            }
            else
            {
                requestAnimationFrame(() => this.update())
            }
        }
    }

    /**
     * defaults for Drawer
     * @type {object}
     */
    static get defaults()
    {
        return Drawer._defaults
    }
    static set defaults(value)
    {
        Drawer._defaults = value
    }
}

Drawer.defaults = defaults

module.exports = Drawer

/**
  * trigger when the drawer is opening from UI click or calling drawer.open()
  * @event Drawer~opening
  * @type {object}
  * @property {Drawer} drawer
  */

/**
  * trigger when drawing is closing from UI click or calling drawer.close()
  * @event Drawer~closing
  * @type {object}
  * @property {Drawer} drawer
  */

/**
  * trigger when drawer is fully opened because of UI interaction or drawer.open() finishing
  * @event Drawer~opened
  * @type {object}
  * @property {Drawer} drawer
  */

/**
  * trigger when drawer is fully closed because of UI interaction or drawer.close() finishing
  * @event Drawer~closed
  * @type {object}
  * @property {Drawer} drawer
  */

/**
  * trigger when drawer's location changes because of UI interaction or drawer.close/open
  * @event Drawer~location
  * @type {object}
  * @property {number} location of drawer
  * @property {Drawer} drawer
  */