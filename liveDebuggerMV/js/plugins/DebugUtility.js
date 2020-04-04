//=============================================================================
// DebugUtility.js
// PUBLIC DOMAIN
// ----------------------------------------------------------------------------
// 2017/09/03 iOSで「決定」ボタンを押せないバグを修正＆裏のゲーム画面のクリックを無効に
// 2018/12/06 入力欄の大きさを画面サイズに追従＆iPhoneで画面がズレるバグ修正＆文字サイズ設定＆初期値設定
// 2020/04/04 デバッグ画面にアツマール上でも実行できるコンソールを発動。
//=============================================================================

/*:
 * @plugindesc デバッグ画面追加
 * @author Linkscape (feat １１１, くらむぼん)
 *
 * 
 *
 * @help 次のプラグインを必ず入れてください
 * AtsumaruGetSelfInformation.js
 *
 * F7でコマンドを開き、そこにプログラムを入力すれば
 * 実行ボタンを押してプログラムを作動させることができます。
 * これはevalで任意の実行ができるということです。
 * セキュリティ上非常に危ないので、何らかの対応策が必要です。
 *
 * -デバッグを可能にするプレイヤーを制限することができます。
 * DebugPlayerIdに自分のアツマールのアカウントを入れてください。
 * 0にすれば誰でもデバッグできるようになります。
 * また、プラグインコマンドから呼び出した場合は、全てのプレイヤーに実行可能です。
 * あくまでF7を制限するだけです。
 *
 * @param DebugPlayerId
 * @text デバッグ用アツマールID
 * @desc デバッグモードにできるIDを設定します。
 * ここが0の場合、全てのプレイヤーがデバッグ可能となります。
 * ※りんすけのIDは35500347
 * @type Number[]
 * @default [35500347]
 * 
 *
 * @param AlwaysShowConsole
 * @text プラグインコマンド時のみデバッグを許可するか
 * @desc F7ではなくプラグインコマンド時のみデバッグを許可します。
 * @type Boolean
 * @default false
 *
 * 注意！！
 * 変数変更のGame_Variables.setValueに重いError処理を組み込んでいます。
 * 動作が重くなることが予想されます。
 * これはあくまでデバッグ用なので、本番では外した方がよいでしょう。
 * 
 * アツマールでユーザー情報を取得して、ユーザー名と自分の名前が一致していれば、
 * F9で変数操作することができます。
 *
 *
 * ライセンス：
 * このプラグインの利用法に制限はありません。お好きなようにどうぞ。
*/
(function() {
    
    /////// 特定のIDならば、アツマール上でもデバッグモードにします。
    /////// ただし、0を入力しているならば全てのプレイヤーにデバッグモードを許可します。
    /////// また、そもそもエディタ上のテストプレイならばデバッグモードは可能です。
    paramsAtsumaruGSI = PluginManager.parameters("AtsumaruGetSelfInformation")
    paramsDU = PluginManager.parameters("DebugUtility")
    Input.keyMapper[118] = "debug2"
    
    const _Scene_Base_prototype_initialize = Scene_Base.prototype.initialize;
    Scene_Base.prototype.initialize = function() {
        var args = new Array();
        try{
            Game_Interpreter.prototype.pluginCommand("GetSelfInformation", args)
        }catch(e){
            console.log("読み込みに失敗しました")
        }
        _Scene_Base_prototype_initialize.call(this)
    };
    
    const _Scene_Map_prototype_update = Scene_Map.prototype.update 
    Scene_Map.prototype.update = function() {
        if(!$gameTemp._isPlaytest) $gameTemp._isPlaytest = checkSelfVariables()
        _Scene_Map_prototype_update.call(this);
    };
    
    function checkSelfVariables(){
        id = paramsAtsumaruGSI.id
        test = paramsDU.DebugPlayerId.replace(/[\[\]\"]/g,"").split(",")
        if(Number(test[0]) == 0 && test.length == 1) return true; 
        const matchVar = (a) => $gameVariables.value(id) == Number(a)
        return test.some(matchVar)
    }
    
    //
    //
    //

    //１１１様とくらむぼん様のプログラムを書き換えています。
    
    function stopPropagation(event) {
        event.stopPropagation();
    }

    // css追加
    (function(){
        var css = document.createElement('link');
        css.rel = "stylesheet";
        css.type = 'text/css';
        css.href = './css/111_InputForm.css';
        var b_top = document.getElementsByTagName('head')[0];
        b_top.appendChild(css);
    })();
    
    // キー入力不可にする為に
    Input.form_mode = false;
    var _Input_onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        if(Input.form_mode)return;
        _Input_onKeyDown.call(this , event)
    };
    var _Input_onKeyUp = Input._onKeyUp;
    Input._onKeyUp = function(event) {
        if(Input.form_mode)return;
        _Input_onKeyUp.call(this , event)
    };
    // 入力終わるまで次のイベントコマンド読み込まない
    var _Game_Interpreter_updateWaitMode =
            Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function(){
        if(this._waitMode == 'input_form')return true;
        return _Game_Interpreter_updateWaitMode.call(this);
    }

    HTMLElement.prototype.postionAdjust = function(screen_postion , target_postion, unitFontSize){
        this.style.left = screen_postion[0] + target_postion[0] * Graphics._realScale + "px";
        this.style.top  = screen_postion[1] + target_postion[1] * Graphics._realScale + "px";
        this.style.fontSize = unitFontSize * Graphics._realScale + "px";
        this.style.maxWidth = 'calc(100% - ' + this.style.left + ')';
        //this.style.maxHeight = 'calc(100% - ' + this.style.top + ')';
    };
    // 引数のx=350;y=200;みたいなのを可能にする
    var argHash = function(text , arg_names){
        var _args = new Array(arg_names.length);
        if(!text) return _args;
        var ary = text.split(";");
        ary.forEach(function(str){
            var s_ary = str.split("=");
            var prop = s_ary[0].toLowerCase();
            var value = s_ary[1];
            _args[arg_names.indexOf(prop)] = value;
        });
        return _args;
    }
    
    //===================================================================
    // Scene_Map - AddDebugMode
    //===================================================================
    
    const _Scene_Map_prototype_updateCallDebug = Scene_Map.prototype.updateCallDebug
    Scene_Map.prototype.updateCallDebug = function() {
        _Scene_Map_prototype_updateCallDebug.call(this)
        if(this.isDebugCalled2()){
            Game_Interpreter.prototype.pluginCommand("CreateDebugger", [0])
        }
    };

    Scene_Map.prototype.isDebugCalled2 = function() {
        return Input.isTriggered('debug2') && $gameTemp.isPlaytest() && paramsDU.AlwaysShowConsole == "false";
    };
    
    //=============================================================================
    // Game_Interpreter - register plugin commands
    //=============================================================================
    var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'CreateDebugger'){
            var _ary = argHash(args[0] , ["x" , "y" , "v" , "max" , "if_s", "btn_x", "btn_y", "font_size", "placeholder"]);
            var target_x = +_ary[0];
            var target_y = +_ary[1];
            var variables_id = +_ary[2];
            var max_count = _ary[3] || null;
            var if_switch_id = Number(_ary[4]) || null;
            var button_x = +_ary[5] || 0;
            var button_y = _ary[6] === '' || isNaN(_ary[6]) ? 50 : +_ary[6];
            var unitFontSize = _ary[7] === '' || isNaN(_ary[7]) ? 24 : +_ary[7];
            var placeholder = _ary[8];

            var interpreter = this;
            var gui = {
                input : null ,
                submit : null ,
                prev: null,
                next: null,
                is_pc : true ,
                submits : null,
                init : function(){
                    this.is_pc = Utils.isNwjs();
                    this.create();
                    this.input.focus();
                    this.screenAdjust();
                } ,
                createButton : function(name, left, id, value){
                    this[name] = document.createElement('input');
                    this[name].setAttribute('type', 'submit');
                    this[name].style.left = left + "px"
                    this[name].setAttribute('id', id);
                    this[name].setAttribute('value', value);
                    document.body.appendChild(this[name]);
                } ,
                create : function(){
                    // 入力フォーム
                    this.input = document.createElement('textArea');
                    this.input.setAttribute('id', '_111_input');
                    if(max_count)this.input.setAttribute('maxlength', max_count);

                    if (placeholder === '$') {
                        placeholder = $gameVariables.value(variables_id);
                    }
                    this.input.setAttribute('value', placeholder || '');
                    document.body.appendChild(this.input);
                    // 送信ボタン
                    this.createButton("submit",0,"_111_submit","実行")
                    //this.createButton("next",70,"_111_submit","→")
                    //this.createButton("prev",120,"_111_submit","←")
                    this.createButton("terminate",170,"_111_submit","終了")
                    this.submits = [this.submit, this.terminate]
                } ,
                success : function(){
                    try{
                        console.log(this.input.value)
                        var log = eval(this.input.value);
                        console.log(log)
                        this.input.value　+= "\n//"+log
                    }catch(e){
                        console.log(e);
                        this.input.value　+= "\n//"+e
                    }
                } ,
                cancel : function(){
                    this.end();
                } ,
                start : function(){
                    interpreter.setWaitMode('input_form');
                    Input.clear();
                    Input.form_mode = true;
                    // SceneManager._scene.stop();
                } ,
                end : function(){
                    this.input.remove(); // document.body.removeChild(this.input);
                    for(let i=0; i < this.submits.length; i++){
                        var element = this.submits[i]
                        element.remove();
                    }
                    window.removeEventListener("resize", resizeEvent, false);
                    interpreter.setWaitMode('');
                    Input.form_mode = false;
                    clearInterval(_event);
                    // SceneManager._scene.start();
                } ,
                screenAdjust : function(){ // canvasの左上を基準にした位置に合わせる
                    var screen_x , screen_y;
                    var _canvas = document.querySelector('#UpperCanvas');
                    var rect = _canvas.getBoundingClientRect();
                    screen_x = rect.left;
                    screen_y = rect.top;
                    this.input.postionAdjust([screen_x,screen_y] , [target_x,target_y], unitFontSize);
                    for(let i=0; i < this.submits.length; i++){
                        var element = this.submits[i]
                        element.postionAdjust([screen_x,screen_y] , [target_x,target_y], unitFontSize)
                    }
                    /*
                    this.input.postionAdjust([screen_x,screen_y] , [target_x,target_y], unitFontSize);
                    this.submit.postionAdjust([screen_x,screen_y] , [target_x + button_x,target_y + button_y], unitFontSize);
                    this.next.postionAdjust([screen_x,screen_y] , [target_x + button_x,target_y + button_y], unitFontSize);
                    this.prev.postionAdjust([screen_x,screen_y] , [target_x + button_x,target_y + button_y], unitFontSize);
                    */
                }
                
            }
            //
            gui.init();
            // 送信するイベントgui.input.onkeydown = function(e){
            gui.input.addEventListener("keydown" ,function(e){
                /*
                if(e.keyCode === 13){ // 決定キーで送信
                    Input.clear();
                    gui.success();
                    // 親へのイベント伝播を止める（documentのkeydownが反応しないように）
                    e.stopPropagation();
                }*/
            });
            
            
            //////////////////////////////////////////////////////////////////////
            //Cssファイルもいちいち導入するのめんどくさいでしょうから、直に書きます
            var InputCss = {
                "position": "absolute",
                "z-index":"999", /* */
                "top":"50px",
                /* テキストフォームの文字の大きさはプラグインコマンドで指定します */
                "width" : "25em", /* ←この数字はウインドウの幅を表しています */
                "height" : String(Graphics.height - 100) + "px", /* ←この数字はウインドウの高さを表しています */
                "font-weight": "bold",
                "color": "#f8f8f8",
                "text-shadow": "black 0.04em 0.04em 0em, black -0.04em 0.04em 0em, black 0.04em -0.04em 0em, black -0.04em -0.04em 0em",
                "font-family": "GameFont",
                "border":"solid 0.125em #f8f8f8",
                "border-radius": "0.2em",
                "padding": "0.04em 0em",
                "background" : "rgba(0,0,0, 0.5)"
            }
            
            var SubmitCss = {
                "position": "absolute", /* */
                "z-index":999, /* */
                "font-weight":"bold", 
                "color": "#f8f8f8",
                "text-shadow": "black 0.04em 0.04em 0em, black -0.04em 0.04em 0em, black 0.04em -0.04em 0em, black -0.04em -0.04em 0em",
                "font-family": "GameFont",
                "border":"solid 0.125em #f8f8f8",
                "border-radius": "0.2emm",
                "padding": "0.04em 0.25em",
                "background": "rgba(0,0,0, 0.5)",
            }
                        
            for(let key in InputCss){
                gui.input.style[key] = InputCss[key]
            }
            
            submits = gui.submits
            for(let i=0; i < submits.length; i++){
                for(let key in SubmitCss){
                    gui.submits[i].style[key] = SubmitCss[key]
                }
                gui.submits[i].addEventListener("mousedown", stopPropagation);
                gui.submits[i].addEventListener("touchstart", stopPropagation);
            }
            //Cssファイルも同梱
            //////////////////////////////////////////////////////////////////////
            
            gui.submit.addEventListener("click" ,function(){ // 送信ボタンクリック
                gui.success();
                return false;
            });
            gui.terminate.addEventListener("click" ,function(){ // 終了ボタンクリック
                gui.end();
                return false;
            });
            
            
            // キャンセルするイベント
            if (if_switch_id) {
                var _event = setInterval(function(){
                    if($gameSwitches.value(if_switch_id)){
                        // clearInterval(_event);
                        gui.cancel();
                    }
                }, 1);
            }

            // webではウィンドー大きさ変わる度に%求め直すイベントもいる
            //if(! gui.is_pc){
                var resizeEvent = gui.screenAdjust.bind(gui);
                window.addEventListener("resize", resizeEvent, false);
            //}
            //
            gui.start();
        }
    };
})();
