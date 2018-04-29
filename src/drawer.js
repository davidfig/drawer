const Ease = require('dom-ease')
const moment = require('moment')

const html = require('./html')

module.exports = class Drawer
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
     * @param {object} [options.styles] styles for div
     * @param {string} [options.className] class name for div
     * @param {string} [options.barBackground=rgba(0,0,0,0.25)] background setting for drag bar
     * @param {string} [options.ease=easeInOutSine] ease for animated opening
     * @param {number} [options.duration=500] animate time for opening drawer on click
     * @param {number} [options.threshold=10] number of pixels before move starts
     * @param {number} [options.timeRecent=100] maximum time in milliseconds to use when calculating acceleration
     * @param {number} [options.minVelocty=0.001] minimum velocity (pixels/millisecond) for opening and closing after a drag
     */
    constructor(options)
    {
        options = options || {}
        this.ease = new Ease({ ease: options.ease || 'easeInOutSine', duration: typeof options.duration !== 'undefined' ? options.duration : 500 })
        const parent = options.parent || document.body
        this._size = options.size
        this._barSize = options.barSize || 20

        /**
         * whether the drawer should take up the full width or height
         */
        this.full = options.full

        /**
         * minimum velocity (pixels/millisecond) for opening and closing after a drag
         * @type (number)
         */
        this.minVelocity = options.minVelocity || 0.01

        /**
         * maximum time in milliseconds to use when calculating acceleration
         * @type {number}
         */
        this.timeRecent = options.timeRecent || 100

        /**
         * automatically open and close the drawer based on acceleration or click
         * @type {boolean}
         */
        this.auto = typeof options.auto === 'undefined' ? true : options.auto

        /**
         * number of pixels before move starts after a mousedown or touchstart
         * @type {number}
         */
        this.threshold = options.threshold || 10

        /**
         * animate time for opening drawer on click
         * @type {number}
         **/
        this.duration = options.duration

        /**
         * Main drawer element
         * @type {HTMLElement}
         */
        this.div = html({
            parent,
            defaultStyles: {
                'position': 'absolute',
                'background': 'white'
            },
            styles: options.styles
        })

        if (options.className)
        {
            this.div.className = options.className
        }

        /**
         * Bar drawer element
         * @type {HTMLElement}
         */
        this.bar = html({
            parent,
            styles: {
                'position': 'absolute',
                'background': options.barBackground || 'rgba(0,0,0,0.15)',
                'cursor': ['drag', '-webkit-grab', 'pointer']
            }
        })

        this.side = options.side || 'left'
        if (options.open)
        {
            this.open(true)
        }
        this._addListeners()
    }

    get side()
    {
        return this._side
    }
    set side(value)
    {
        this._side = value
        this.vertical = value === 'left' || value === 'right'
        this._setSide()
        if (this.opened)
        {
            this.open(true)
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
        this._setSide()
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
        this._setSide()
        if (this.opened)
        {
            this.open(false)
        }
    }

    _setSide()
    {
        if (this.full)
        {
            if (this.vertical)
            {
                this.div.style.top = 0
                this.div.style.height = this.bar.style.height = '100vh'
                this.div.style.width = this._size ? this._size + 'px' : 'auto'
                this.bar.style.width = this.barSize + 'px'
                if (this.opened)
                {
                    this.div.style.left = 0
                }
                else
                {
                    this.div.style.left = -this.size + 'px'
                }
            }
            this.bar.style[this.side] = 0
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
        this.bar.addEventListener('mousecancel', (e) => this._up(e))
        this.bar.addEventListener('touchend', (e) => this._up(e))
        document.body.addEventListener('mouseup', (e) => this._up(e))
        document.body.addEventListener('touchend', (e) => this._up(e))
    }

    _down(e)
    {
        this.down = { x: e.pageX, y: e.pageY }
        this.changes = []
        this.moving = false
        if (this.bar.style.cursor === 'grab' || this.bar.style.cursor === '-webkit-grab')
        {
            html.styles(this.bar, { 'cursor': ['grabbing', '-webkit-grabbing' ]})
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
            if (this.side === 'left' || this.side === 'right')
            {
                let x = e.pageX - this.barSize / 2
                x = x > this.size ? this.size : x
                x = x < 0 ? 0 : x
                this.div.style.left = x - this.size + 'px'
                this.bar.style.left = x + 'px'
                this.changes.push({ value: x, time: moment() })
            }
            e.preventDefault()
        }
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
                    let velocity = deltaDistance / deltaTime
                    if (velocity === 0)
                    {
                        this._forceToggle()
                    }
                    else
                    {
                        if (Math.abs(velocity) < this.minVelocity)
                        {
                            velocity = this.minVelocity * (velocity < 0)
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
                html.styles(this.bar, { 'cursor': ['grab', '-webkit-grab'] })
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
            this.ease.removeAll()
            if (noAnimate)
            {
                this.div.style[this.side] = 0
                this.bar.style[this.side] = this.size + 'px'
            }
            else
            {
                this._openAnimate()
            }
            this.opened = true
        }
    }

    _openAnimate(velocity)
    {
        const change = {}
        change[this.side] = 0
        const barChange = {}
        barChange[this.side] = this.size
        const duration = velocity ? Math.abs(0 - this.div.offsetWidth) / velocity : this.duration
        this.ease.add(this.div, change, { duration })
        this.ease.add(this.bar, barChange, { duration })
    }

    /**
     * close the drawer
     * @param {boolean} [noAnimate]
     */
    close(noAnimate)
    {
        if (this.down || this.opened)
        {
            this.ease.removeAll()
            if (noAnimate)
            {
                this.div.style[this.side] = -this.size + 'px'
                this.bar.style[this.side] = 0
            }
            else
            {
                this._closeAnimate()
            }
            this.opened = false
        }
    }

    _closeAnimate(velocity)
    {
        const change = {}
        change[this.side] = -this.size
        const barChange = {}
        barChange[this.side] = 0
        const side = this.side.substr(0, 1).toUpperCase() + this.side.substr(1)
        const duration = velocity ? Math.abs((this.div['offset' + side] - this.size) / velocity) : this.duration
        this.ease.add(this.div, change, { duration })
        this.ease.add(this.bar, barChange, { duration })
    }
}