const sleep = async (time) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(1)
        }, time)
    })
}
var EventUtil = {
    addHandler: function (element, type, handler) {
        if (element.addEventListener)
            element.addEventListener(type, handler, false);
        else if (element.attachEvent)
            element.attachEvent("on" + type, handler);
        else
            element["on" + type] = handler;
    },
    removeHandler: function (element, type, handler) {
        if (element.removeEventListener)
            element.removeEventListener(type, handler, false);
        else if (element.detachEvent)
            element.detachEvent("on" + type, handler);
        else
            element["on" + type] = handler;
    },
    /**
     * 监听触摸的方向
     * @param target            要绑定监听的目标元素
     * @param isPreventDefault  是否屏蔽掉触摸滑动的默认行为（例如页面的上下滚动，缩放等）
     * @param upCallback        向上滑动的监听回调（若不关心，可以不传，或传false）
     * @param rightCallback     向右滑动的监听回调（若不关心，可以不传，或传false）
     * @param downCallback      向下滑动的监听回调（若不关心，可以不传，或传false）
     * @param leftCallback      向左滑动的监听回调（若不关心，可以不传，或传false）
     */
    listenTouchDirection: function (target, isPreventDefault, upCallback, rightCallback, downCallback, leftCallback) {
        this.addHandler(target, "touchstart", handleTouchEvent);
        this.addHandler(target, "touchend", handleTouchEvent);
        this.addHandler(target, "touchmove", handleTouchEvent);
        var startX;
        var startY;
        function handleTouchEvent(event) {
            switch (event.type) {
                case "touchstart":
                    startX = event.touches[0].clientX;
                    startY = event.touches[0].clientY;
                    break;
                case "touchend":
                    var spanX = event.changedTouches[0].clientX - startX;
                    var spanY = event.changedTouches[0].clientY - startY;

                    if (Math.abs(spanX) > Math.abs(spanY)) {      //认定为水平方向滑动
                        if (spanX > 30) {         //向右
                            if (rightCallback)
                                rightCallback();
                        } else if (spanX < -30) { //向左
                            if (leftCallback)
                                leftCallback();
                        }
                    } else {                                    //认定为垂直方向滑动
                        if (spanY > 30) {         //向下
                            if (downCallback)
                                downCallback();
                        } else if (spanY < -30) {//向上
                            if (upCallback)
                                upCallback();
                        }
                    }

                    break;
                case "touchmove":
                    //阻止默认行为
                    if (isPreventDefault) {
                        event && event.preventDefault();
                    }
                    break;
            }
        }
    }
};
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
        this.isInView = false
        this.init()
        // this.start()
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

        // PC 端鼠标移入目标区域停止自动滚动
        // this.$container.addEventListener('mouseenter', () => {
        //     this.clear()
        // })
        // this.$container.addEventListener('mouseleave', () => {
        //     this.start()
        // })
        // pc 端左右按钮
        this.$leftBtn.addEventListener('click', async () => {
            await this.prev()
        })
        this.$rightBtn.addEventListener('click', async () => {
            await this.next()
        })
        // 移动端滑动事件
        EventUtil.listenTouchDirection(this.$container, false, () => { }, () => {
            if (this.isInView) this.prev()
        }, () => { }, () => {
            if (this.isInView) this.next()
        })

        // 进入视图内才开始自动滚动
        const scrollHandle = () => {
            const clientHeight = document.documentElement.clientHeight;
            const boundingBox = this.$container.getBoundingClientRect();
            const top = boundingBox.top;

            if (boundingBox.height < clientHeight) {
                if (top < -300 || top > (clientHeight - boundingBox.height + 300)) {
                    console.log('clear')
                    this.clear()
                    this.isInView = false
                } else if (top <= (clientHeight - boundingBox.height + 300)) {
                    this.start()
                    this.isInView = true
                }
            } else {
                if (top > 300 || boundingBox.bottom < clientHeight) {
                    console.log('clear')
                    this.clear()
                    this.isInView = false
                } else if (top < 300) {
                    this.start()
                    this.isInView = true
                }
            }
        }
        window.addEventListener("scroll", scrollHandle);
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
        console.log('next')
        this.clear()
        await this.hideActivePoint(this.currentIndex)
        await this.move(this.currentIndex + 1)
        await this.showActivePoint(this.currentIndex + 1)
        this.isRunning = false
    }
    async prev() {
        if (this.isRunning) return
        if (this.currentIndex === 0) return
        this.isRunning = true
        console.log('prev')
        this.clear()
        await this.hideActivePoint(this.currentIndex)
        await this.move(this.currentIndex - 1)
        await this.showActivePoint(this.currentIndex - 1)
        this.isRunning = false
    }
    clear() {
        if (this.timer) {
            console.log('clear')
            clearTimeout(this.timer)
            this.timer = null
        }
    }
    start() {
        if (this.timer) return
        console.log('start')
        this.timer = setTimeout(() => {
            this.next()
            this.timer = null
            this.start()
            console.log(new Date().getTime() / 1000)
        }, 8000)
    }
}
