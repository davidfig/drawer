const Penner = require('penner')
const moment = require('moment')

const html = require('./html')

class Drawer
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
     * @param {number} [options.minVelocty=0.5] minimum velocity (pixels/millisecond) for opening and closing after a drag
     * @param {string} [options.content] HTML content for the drawer
     * @param {object} [options.contentStyles] styles for content of drawer
     */
    constructor(options)
    {
        options = options || {}
        const parent = options.parent || document.body
        this._size = options.size
        this._barSize = options.barSize || 20
        this.ease = options.ease ? (typeof options.ease === 'function' ? options.ease : Penner[options.ease]) : Penner.linear

        /**
         * whether the drawer should take up the full width or height
         */
        this.full = options.full

        /**
         * minimum velocity (pixels/millisecond) for opening and closing after a drag
         * @type (number)
         */
        this.minVelocity = options.minVelocity || 0.5

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
        this.duration = typeof options.duration === 'undefined' ? 500 : options.duration

        /**
         * Main drawer element
         * @type {HTMLElement}
         */
        this.div = html({
            parent,
            defaultStyles: {
                'position': 'fixed',
                'background': 'white'
            },
            styles: options.styles
        })

        /**
         * use this to add content to the div
         * @type {HTMLElement}
         */
        this.content = html({ parent: this.div, styles: options.contentStyles, html: options.content })

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
                'position': 'fixed',
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

    /**
     * call this when the contents of the drawer are updated
     */
    update()
    {
        this._setSide()
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
            if (this.full)
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
            if (this.full)
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
            value = value > this.size ? this.size : value
            value = value < 0 ? 0 : value
            this.div.style[this.side] = value - this.size + 'px'
            this.bar.style[this.side] = value + 'px'
            this.changes.push({ value, time: moment() })
            e.preventDefault()
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
            this.easing = null
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
        const end = 0
        const duration = velocity ? Math.abs(0 - this.size) / velocity : this.duration
        this.easing = { start: this._getCurrent(), end, time: moment(), ease: velocity ? Penner.linear : this.ease, duration }
        requestAnimationFrame(() => this.update())
    }

    _getCurrent()
    {
        switch (this.side)
        {
            case 'left':
                return this.div.offsetLeft
            case 'right':
                return this.div.parentNode.offsetWidth - (this.div.offsetLeft + this.div.offsetWidth)
            case 'top':
                return this.div.offsetTop
            case 'bottom':
                return window.innerHeight - (this.div.offsetTop + this.div.offsetHeight)
        }
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
        const start = this._getCurrent()
        const duration = velocity ? Math.abs((start - this.size) / velocity) : this.duration
        this.easing = { start, end: -this.size, time: moment(), ease: velocity ? Penner.linear : this.ease, duration }
        requestAnimationFrame(() => this.update())
    }

    update()
    {
        if (this.easing)
        {
            let duration = moment().diff(this.easing.time)
            duration = duration > this.easing.duration ? this.easing.duration : duration
            const value = this.ease(duration, this.easing.start, this.easing.end - this.easing.start, this.easing.duration)
            this.div.style[this.side] = value + 'px'
            this.bar.style[this.side] = value + this.size + 'px'
            if (duration === this.easing.duration)
            {
                this.easing = null
            }
            else
            {
                requestAnimationFrame(() => this.update())
            }
        }
    }
}

module.exports = Drawer