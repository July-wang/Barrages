
(function (window, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return (window.Barrage = factory());
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        window.Barrage = factory();
    }
})(this, function () {
    'use strict';
    /**
     * 创建文字
     * @param {String} text 
     * @param {Number} size 
     */
    var Text = function (options) {
        // console.log(options)
        if (options == undefined) { 
            options = {
                fontSize: 14 , 
                fontStyle: 'normal' , 
                fontFamily: 'sans-serif' , 
                fontWeight: 'normal' , 
                color: this.colorRandom()
            }
        }
        this.x = 0; //起始位置x
        this.y = 0; //起始位置x
        this.vx = 0;   
        // this.vy = 0;
        this.text = options.name; //文字内容
        this.fontSize = options.fontSize;
        this.fontStyle = options.fontStyle;
        this.fontFamily = options.fontFamily;
        this.fontWeight = options.fontWeight;
        this.color = options.color;
        this.width = this.strlen(this.text) * this.fontSize;
        this.height = this.fontSize + 2;
        this.isWait = true;
    }
    /**
     * 获取字符长度。一个汉字为一个单位，英文字符算.5个，计算文字大概宽度
     * @param {String} str 
     */
    Text.prototype.strlen = function (str){
        var len = 0;
        for (var i = 0; i < str.length; i++) { 
            var c = str.charCodeAt(i); 
            //单字节加1 
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60<=c && c<=0xff9f)) { 
                len += 0.5; 
            } else { 
                len += 1; 
            } 
        } 
        return len;
    }
    /**
     * 随机一个颜色
     * @return {String} RGB() 颜色
     */
    Text.prototype.colorRandom = function () {
        var r = Math.floor(Math.random() * 255);
        var g = Math.floor(Math.random() * 255);
        var b = Math.floor(Math.random() * 255);
        
        return "rgb("+ r +','+ g +','+ b +")";
    }
    /**
     * 画出文字
     * @param {Canvas.context} context 
     */
    Text.prototype.draw = function(context){
        context.save();
        context.font =  this.fontSize + 'px ' + this.fontFamily; 
        context.textBaseline = "top"; 
        context.fillStyle = this.color;
        this.width = context.measureText(this.text).width; 
        context.fillText(this.text , this.x , this.y); 
        context.restore();
    }
    /**
     * 得到文字的左上角坐标和宽高
     */
    Text.prototype.getBounds = function(){
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    var canvas  , context , 
        bind = function(fn, me){ return function(){  return fn.apply(me, arguments) } }
    /**
     * 创建Barrage
     * @param {HTMLElement} id值 
     * @param {Object} options 用户设置
     */
    var Barrage = function (element , options) {
        canvas = document.getElementById(element) 
        context = canvas.getContext('2d')
        this._defaults = {
            autoSize: true,
            sizeRange: [12, 30],    //字体大小范围
            maxItems: 20 ,          //屏幕容纳的最大内容
            minItems: 10 ,          //屏幕容纳的最小内容
            VX: -1.3 ,              //相当于速度，正数为从左到右，负数为从右到左
            itemStyle: {
                fontSize: 14 ,
                fontStyle: 'normal' ,
                fontFamily: 'sans-serif' ,      //字体名
                color: this.colorRandom(),      //字体颜色
                fontWeight: 'normal'
            },
            data: [] //{name: '' , value: '' , itemStyle: ''}
        }

        this.validTexs = []
        this.waitTexs = []
        // value的全部集合
        this.valueExtent = []
        // value最大值最小值的域
        this.domain = []
        this.move = bind(this.move, this)
        this.drawFrame = bind(this.drawFrame, this)
        this.init(this._defaults , options)
    }
    /**
     * 初始化数据
     * @param {Object} _defaults 默认配置信息
     * @param {Object} options 用户设置
     */
    Barrage.prototype.init = function (_defaults , options) {
        this.options = this.extend({}, _defaults, options);
        this.MIN_TEXT = this.options.minItems
        this.MAX_TEXT = this.options.maxItems
        this.initData()
        this.initText()
        
        this.drawFrame()
    }

    Barrage.prototype.initData = function () {
        var data = this.options.data 
        for (var i = 0; i < data.length; i ++) {
            this.valueExtent.push(parseFloat(data[i].value))
        }

        var mData = this.getDataDomain()
        this.domain = [mData.min , mData.max]
    }

    Barrage.prototype.initText = function () {
        // 如果数组大于最大容纳
        console.log(this.options)
        var data = this.options.data
        for (var i = 0; i < data.length; i++) {
            var isWait = false
            if (i >= this.MAX_TEXT) {
                isWait = true
            }
            this.createText(data[i] , isWait)
        }
    }
    /**
     * 
     * @param {Text.<object>} text 
     * @param {Boolean} isWait 
     */
    Barrage.prototype.createText = function (data , isWait) {
        var options = {
            name: data.name ,
            fontSize: data.itemStyle && data.itemStyle.fontSize ? data.itemStyle.fontSize : (this.options.autoSize ? this.linearMap(data.value , this.domain , this.options.sizeRange) : this.options.itemStyle.fontSize),
            fontStyle: data.itemStyle && data.itemStyle.fontStyle ? data.itemStyle.fontStyle : this.options.itemStyle.fontStyle,
            fontFamily: data.itemStyle && data.itemStyle.fontFamily ? data.itemStyle.fontFamily : this.options.itemStyle.fontFamily,
            color: data.itemStyle && data.itemStyle.color ? data.itemStyle.color : this.colorRandom(),
            fontWeight: data.itemStyle && data.itemStyle.fontWeight ? data.itemStyle.fontWeight : this.options.itemStyle.fontWeight
        }
        
        var item = new Text(options) , 
            position = this.getRandomPosition(item)
        item.x = position.x
        item.y = position.y
        item.vx = this.options.VX

        if (this.validTexs.length <= 0) {
            item.isWait = false
            this.validTexs.push(item)
        } else if (isWait) {
            item.isWait = true
            this.waitTexs.push(item)
        } 
        else {
            // 判断是否定位失败
            var isFail = false;
            // isOverlap =false 不重叠 =true 重叠
            var isOverlap = this.checkOverlap(item);
            if (isOverlap) {
                var rechecked = this.checkedreOverlap(item);
                if (!rechecked) {
                    isFail = true
                    isOverlap = true
                } else {
                    isOverlap = false
                }
            }                    
            if (!isFail && !isWait) {
                item.isWait = false
                this.validTexs.push(item)
            } else {
                item.isWait = true
                this.waitTexs.push(item)
            }
        }
    }

    /**
     * 获取随机颜色 (亮色)
     * @requires {String} 颜色rgb值
     */
    Barrage.prototype.colorRandom = function () {
        var r = Math.floor(Math.random() * 255 + 66);
        var g = Math.floor(Math.random() * 255 + 66);
        var b = Math.floor(Math.random() * 255 + 66);
        
        return "rgb("+ r +','+ g +','+ b +")";
    }
    /**
     * 获取item随机位置（防止文字超出屏幕，减去文字的高度）
     * @requires {String} 颜色rgb值
     */
    Barrage.prototype.getRandomPosition = function (item) {
        var x = Math.random() * canvas.width + canvas.width  
        var y = Math.random() * (canvas.height - item.height)
        return {
            x: x , 
            y: y
        }
    }
    /**
     * extend 拷贝
     * @param {Obejct , Object....} data  
     * @returns {Object} 
     */
    Barrage.prototype.extend = function () {
        var src, copyIsArray, copy, name, options, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		if ( typeof target === "boolean" ) {
			deep = target;
			target = arguments[ i ] || {};
			i++;
		}
		if ( typeof target !== "object" && !(Object.prototype.toString.apply(target) === "[object Function]") ) {
			target = {};
		}
		if ( i === length ) {
			target = this;
			i--;
		}
		for ( ; i < length; i++ ) {
			if ( (options = arguments[ i ]) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];
					if ( target === copy ) {
						continue;
					}
					if ( deep && copy && (copyIsArray = (Object.prototype.toString.apply(copy) === "[object Array]" ))) {
						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && (Object.prototype.toString.apply(src) === "[object Array]") ? src : [];
						} else {
							clone = src;
						}
						target[ name ] = this.extend( deep, clone, copy );
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}
		return target;
    }
    /**
     * 获取给定数据value的集合
     * @param {Array.<number>} data  
     * @returns {Object.<number>}  返回最大值和最小值
     * 
     */
    Barrage.prototype.getDataDomain = function () {
        var valueExtent = this.valueExtent;
        return {
            min: Math.min.apply(null, valueExtent), 
            max: Math.max.apply(null, valueExtent)
        }
    }
    /**
     * 根据value值和size返回获取当前字体的适合大小
     * @param {number/Array.<number>} val  value值  
     * @param {Array.<number>} domain  value域(数组内的最小和最大范围值) [0 , 90000]
     * @param {Array.<number>} range size域(字体大小返回) [12 , 30]
     * @return {number/Array.<number>}
     */
    Barrage.prototype.linearMap = function (val, domain, range) {
        console.log(val, domain, range)
        if (domain[1] - domain[0] === 0) {
            return (range[1] - range[0] === 0) ? range[0] : (range[0] + range[1]) / 2;
        }

        if (val === domain[0]) {
            return range[0]
        } 

        if (val === domain[1]) {
            return range[1]
        }
        return (val - domain[0]) / ( (domain[1] - domain[0]) / (range[1] - range[0])) + range[0]
        
    }
    /**
     * 检测text的位置与当前有效的文字的位置是否重叠
     * @param {Text.<object>} newItem 
     * @return {Boolean}
     */
    Barrage.prototype.checkOverlap = function (newItem) {
        for (var i = 0; i < this.validTexs.length; i++) {
            // isOverlap =false 不重叠 =true 重叠
            var isOverlap = false , 
                item = this.validTexs[i];
            if (newItem.x + newItem.width  >= item.x &&
                item.x + item.width  >= newItem.x &&
                newItem.y + newItem.height >= item.y &&
                item.y + item.height >= newItem.y) {

                isOverlap = true
                break
            } else {
                isOverlap = false
            }                
        }
        return isOverlap
    }
    /**
     * 重置投放位置失败的文字，进行重新投放
     * 5次投放失败为结束条件，失败后返回
     * @param {Text.<object>} newItem 
     * @return {Boolean}
     */
    Barrage.prototype.checkedreOverlap = function (newItem) {
        var isChecked = false;
            for (var i = 0; i <= 4; i++) {
                var position = this.getRandomPosition(newItem)
                newItem.x = position.x
                newItem.y = position.y
                if (!this.checkOverlap(newItem)) {
                    isChecked = true
                    break;
                }
                if (!isChecked && i == 4) {
                    isChecked = false
                    break
                }
            }
            return isChecked
    }
    /**
     * 检测有效的数组是否超出屏幕
     * @param {Text.<object>} item 
     * @return {Boolean}
     */
    Barrage.prototype.checkInvalidedText = function (item) {
        var isFinished = false;
        if (item.x + item.width < 0) {
            isFinished = true;
        }
        return isFinished;
    }
    /**
     * 重置超出屏幕的文字
     * @param {Text.<object>} item 
     * @param {Number} index 当前item所在数组的前缀
     * @return {Boolean}
     */
    Barrage.prototype.resetInvalidedText = function (item , index) {
        // 从有效数组中删除，放进进等待数组中
        this.validTexs.splice(index , 1)
        this.waitTexs.push(item)
        item.x = Math.random() * canvas.width + canvas.width
        item.y = Math.random() * ( canvas.height - 26 )
        item.isWait = true
        item.vx = this.options.VX
    }
    /**
     * 如果小于max_text,投放item
     */
    Barrage.prototype.deliveryWaitText = function () {
        for (var i = 0; i < this.waitTexs.length; i++) {
            if (this.validTexs.length >= 20) {
                break;
            } else {
                var item = this.waitTexs[i] ,
                    isFail = false;
                var isOverlap = this.checkOverlap(item);
                if (isOverlap) {
                    var rechecked = this.checkedreOverlap(item);
                    if (!rechecked) {
                        isFail = true
                    } 
                }                    
                if (!isFail) {
                    item.isWait = false
                    this.waitTexs.splice(i , 1)
                    this.validTexs.push(item)
                } else {
                    item.isWait = true
                }
            }
        }
    }
    /**
     * 开始运动
     * @param {Text.<object>} item 
     * @param {Number} index item所在的数组前缀
     */
    Barrage.prototype.move = function (item , index) {
        var isFinished = this.checkInvalidedText(item)
        if (isFinished) {
            this.resetInvalidedText(item , index)
        } else {
            item.x += item.vx;
        }
        
        if (this.validTexs.length < this.MAX_TEXT) {
            // 投放正在等待的内容
            this.deliveryWaitText()
        }
    }
    /**
     * 绘制文字
     * @param {Text.<object>} item 
     * @param {Canvas.<context>} content 
     */
    Barrage.prototype.drawText = function (item , content) {
        // console.log(item)
        item.draw(context);
    }
    /**
     * 开始绘图
     */
    Barrage.prototype.drawFrame = function () {
        window.requestAnimationFrame(this.drawFrame, canvas);
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.validTexs.forEach(this.move);
        this.validTexs.forEach(this.drawText);
    }
    return Barrage
  
});
