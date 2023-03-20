const sleep = async (time) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1)
        }, time)
    })
}

class historyAxis {
    constructor({
        data,
        moveTime = 1000
    }) {
        this.$container = document.querySelector("#historyAxis")
        this.$pointContainer = document.querySelector('#historyAxis .js-point-list')
        this.$pointContentContainer = document.querySelector('#historyAxis .js-point-content-list')
        this.currentIndex = 0
        this.data = data
        this.moveTime = moveTime
        this.skip = 4
        this.isRunning = false
        this.timer = null
        this.init()
        this.start()
    }
    init() {
        const firstTitle = this.data[0].title
        const lastTile = this.data[this.data.length - 1].title
        const pointList = []
        for (let i = 0; i < this.skip; i++) {
            pointList.unshift(this.createPoint({
                title: firstTitle - i - 1
            }, 'disabled'))
        }
        const pointContentList = []
        for (const [i, item] of Object.entries(this.data)) {
            pointList.push(this.createPoint(item, i === "0" ? 'active-in' : ""))
            pointContentList.push(this.createPointContent(item, i === "0" ? 'active-in' : ""))
        }
        for (let i = 0; i < this.skip; i++) {
            pointList.push(this.createPoint({
                title: Number(lastTile) + i + 1
            }, 'disabled'))
        }
        pointList.push(...new Array(this.skip).fill(this.createPoint()))
        this.$pointContainer.style.width = `${pointList.length * 400}px`
        this.$pointContainer.style.transition = `transform ${this.moveTime / 1000}s ease-in-out`
        this.$pointContainer.innerHTML = pointList.join('')
        this.$pointContentContainer.innerHTML = pointContentList.join('')
        this.$pointList = document.querySelectorAll('#historyAxis .js-point')
        this.$pointContentList = document.querySelectorAll('#historyAxis .js-point-content')
        this.$leftBtn = document.querySelector('#historyAxis .js-btn-left')
        this.$rightBtn = document.querySelector('#historyAxis .js-btn-right')

        this.$container.addEventListener('mouseenter', () => {
            clearTimeout(this.timer)
        })
        this.$container.addEventListener('mouseleave', () => {
            this.start()
        })
        this.$leftBtn.addEventListener('click', async () => {
            await this.prev()
        })
        this.$rightBtn.addEventListener('click', async () => {
            await this.next()
        })
    }
    createPoint({ title } = {}, status = '') {
        return `<div class="js-point ${status}">
                    ${new Array(10).fill('<i></i>').join('')}
                    <i class="active">
                        ${title ? `<h4>${title}</h4>` : ''}
                    </i>
                    ${new Array(9).fill('<i></i>').join('')}
                </div>`
    }
    createPointContent({ title, content } = {}, status) {
        return `
            <div class="js-point-content ${status}">
                <h4>${title}</h4>
                <p>${content}</p>
            </div>
        `
    }
    async hideActivePoint(pointIndex) {
        const $point = this.$pointList[pointIndex + this.skip]
        const $pointContent = this.$pointContentList[pointIndex]
        $point.className = 'js-point active-stop'
        $pointContent.className = 'js-point-content active-stop'
        await sleep(10)
        $point.className = 'js-point active-stop active-out'
        if ($pointContent) $pointContent.className = 'js-point-content active-stop active-out'
        await sleep(2000)
        $point.className = 'js-point'
        $pointContent.className = 'js-point-content'
    }
    async showActivePoint(pointIndex) {
        const $point = this.$pointList[pointIndex + this.skip]
        const $pointContent = this.$pointContentList[pointIndex]
        $point.className = 'js-point active-in'
        $pointContent.className = 'js-point-content active-in'
        await sleep(1000)
        this.currentIndex = pointIndex
    }
    async move(nextPointIndex) {
        this.$pointContainer.style.transform = `translateX(-${(nextPointIndex + this.skip) * 400 + 400}px)`;
        await sleep(this.moveTime)
    }
    async next() {
        if (this.isRunning) return
        if (this.currentIndex >= (this.data.length - 1)) return
        this.isRunning = true
        await this.hideActivePoint(this.currentIndex)
        await this.move(this.currentIndex + 1)
        await this.showActivePoint(this.currentIndex + 1)
        this.isRunning = false
    }
    async prev() {
        if (this.isRunning) return
        if (this.currentIndex === 0) return
        this.isRunning = true
        await this.hideActivePoint(this.currentIndex)
        await this.move(this.currentIndex - 1)
        await this.showActivePoint(this.currentIndex - 1)
        this.isRunning = false
    }
    start() {
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(async () => {
            await this.next()
            this.start()
        }, 5000)
    }
}
