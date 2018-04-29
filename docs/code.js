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
    new Drawer({
        size: 75,
        open: true,
        styles: {
            left: '200px',
            background: 'rgb(150,150,100)',
            color: 'white',
        },
        side: 'top',
        content: 'small top drawer',
        contentStyles: {
            padding: '0.5em'
        }

    })
}

window.onload = () => {
    highlight()
    test()
}