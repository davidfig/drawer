const clicked = require('clicked')

const highlight = require('./highlight')
const Drawer = require('../src/drawer')

function test()
{
    // left
    new Drawer({
        full: true,
        open: true,
        size: 100,
        styles: {
            background: 'rgb(100,100,150)',
            color: 'white',
        },
        content: 'This is an open drawer.<br><br>Click or drag the bar to open or close it.',
        contentStyles: {
            padding: '0.5em'
        }
    })

    // right
    new Drawer({
        open: true,
        size: 200,
        styles: {
            background: 'rgb(100,150,100)',
            color: 'white',
            top: '10em'
        },
        side: 'right',
        content: 'this is a non-full size drawer on the right side',
        contentStyles: {
            padding: '0.5em'
        }
    })

    // bottom
    new Drawer({
        size: 100,
        styles: {
            background: 'rgb(150,100,100)',
            color: 'white',
        },
        side: 'bottom',
        full: true,
        content: 'this is full bottom drawer',
        contentStyles: {
            padding: '0.5em'
        }
    })

    // top
    const drawer = new Drawer({
        size: 75,
        full: false,
        open: true,
        styles: {
            left: '200px',
            background: 'rgb(150,150,100)',
            color: 'white',
        },
        side: 'top',
        content: '<div id="top">click to move</div>',
        contentStyles: {
            padding: '0.5em'
        }
    })
    const top = document.getElementById('top')
    top.style.cursor = 'pointer'
    const sides = ['right', 'bottom', 'left', 'top']
    clicked(top, () =>
    {
        let next = sides.indexOf(drawer.side) + 1
        next = next === sides.length ? 0 : next
        drawer.side = sides[next]
        if (drawer.vertical)
        {
            drawer.top = '200px'
            drawer.update()
        }
        else
        {
            drawer.left = '200px'
            drawer.update()
        }
    })
}

window.onload = () => {
    highlight()
    test()
}