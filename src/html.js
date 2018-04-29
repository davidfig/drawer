function html(options)
{
    options = options || {}
    const object = document.createElement(options.type || 'div')
    if (options.parent)
    {
        options.parent.appendChild(object)
    }
    if (options.defaultStyles)
    {
        html.styles(object, options.defaultStyles)
    }
    if (options.styles)
    {
        html.styles(object, options.styles)
    }
    if (options.html)
    {
        object.innerHTML = options.html
    }
    if (options.id)
    {
        object.id = options.id
    }
    return object
}

html.styles = function (object, styles)
{
    for (let style in styles)
    {
        if (Array.isArray(styles[style]))
        {
            for (let entry of styles[style])
            {
                object.style[style] = entry
                if (object.style[style] === entry)
                {
                    break
                }
            }
        }
        else
        {
            object.style[style] = styles[style]
        }
    }
}

/**
 * determines global location of a div
 * from https://stackoverflow.com/a/26230989/1955997
 * @param {HTMLElement} e
 * @returns {PointLike}
 */
html.toGlobal = function(e)
{
    const box = e.getBoundingClientRect()

    const body = document.body
    const docEl = document.documentElement

    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft

    const clientTop = docEl.clientTop || body.clientTop || 0
    const clientLeft = docEl.clientLeft || body.clientLeft || 0

    const top = box.top + scrollTop - clientTop
    const left = box.left + scrollLeft - clientLeft

    return { y: Math.round(top), x: Math.round(left) }
}

module.exports = html