$ = (sel, node = null) -> (node || document).querySelector sel
elements =
    editor: $ '#editor'
    config: $ '#config'
    wrapper: $ '#wrapper'
    counter: $ '#counter'

# supported languages
langs = [
    'en-us'
    'zh-cn'
]

# helper functions
# hex to rgba clolor
transColor = (hex, alpha) ->
    match = hex.match /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    colors = match.slice 1
        .map (color) -> parseInt color, 16
        .join ','
    'rgba(' + colors + ',' + alpha + ')'

# create audio play function by url
createAudioPlayer = (url) ->
    context = new (window.AudioContext || window.webkitAudioContext)

    new Promise (resolve, reject) ->
        fetch url
            .then (response) -> response.arrayBuffer()
            .then (audioData) ->
                context.decodeAudioData audioData, (audioBuffer) ->
                    resolve () ->
                        source = context.createBufferSource()
                        source.buffer = audioBuffer
                        source.connect context.destination
                        source.start 0
                , reject
            .catch reject


# config class
class Config
    constructor: (@editor) ->
        defaultConfig =
            marginTop: 10
            marginBottom: 30
            width: 780
            fontFamily: 'sans-serif'
            fontSize: 16
            textColor: '#000000',
            backgroundColor: '#FFFFFF',
            keySound: 'none'

        config = localStorage.getItem 'config'
        @data = Object.assign defaultConfig, if !config then {} else JSON.parse config
        @render()

    # render config panel
    render: ->
        lang = navigator.language.toLocaleLowerCase()
        lang = if lang in langs then lang else langs[0]

        createOption = (input, value, text) ->
            option = document.createElement 'option'
            option.value = value
            option.innerText = text
            input.appendChild option

        fetch "./i18n/#{lang}.json"
            .then (response) -> response.json()
            .then (data) =>
                elements.editor.setAttribute 'placeholder', data.placeholder

                for k, v of data.config
                    input = $ '#' + k, elements.config
                    imports = null
                    ($ "label[for=#{k}]", elements.config).innerText = v.label if v.label?

                    if v.options
                        for name, value of v.options
                            createOption input, name, value
                    
                    if v.import
                        imports = {}
                        for name, value of v.import
                            imports[name] = value.value
                            createOption input, name, value.name
                    
                    @bind k, imports

    # save config
    save: ->
        localStorage.setItem 'config', JSON.stringify @data

    # make effect
    effect: (name, value, imports) ->
        switch name
            when 'marginTop'
                document.body.style.paddingTop = value + 'vh'
            when 'marginBottom'
                document.body.style.paddingBottom = value + 'vh'
            when 'width'
                elements.wrapper.style.maxWidth = value + 'px'
            when 'fontFamily'
                document.body.style.fontFamily = if imports? then imports[value] || value else value
            when 'fontSize'
                elements.editor.style.fontSize = value + 'px'
                elements.editor.style.letterSpacing = (value / 25) + 'px'
                elements.counter.style.fontSize = value + 'px'
            when 'textColor'
                elements.editor.style.color = value
                elements.wrapper.style.borderColor = transColor value, 0.3
                elements.counter.style.color = transColor value, 0.5
            when 'backgroundColor'
                document.body.style.backgroundColor = value
            when 'keySound'
                @editor.setSound value

    # bind input element to config data
    bind: (id, imports) ->
        input = $ '#' + id, elements.config
        name = id.replace /-([a-z])/g, (_, letter) -> letter.toUpperCase()
        @effect name, input.value = @data[name], imports

        input.addEventListener 'input', =>
            @effect name, @data[name] = input.value, imports
            @save()


# editor class
class Editor
    constructor: ->
        @player = null
        @ready = false
        editor = elements.editor

        @effectTextInput editor
        @effectKeyPressTone editor
        @effectPastePlainText editor
        @effectHideCursor()

    setSound: (sound) ->
        @player = null if @player?

        if sound != 'none'
            url = "./audio/#{sound}.wav"

            apply = =>
                createAudioPlayer url
                    .then (player) => @player = player

            if @ready
                apply()
            else
                ['keydown', 'click', 'touch'].forEach (type) =>
                    window.addEventListener type, =>
                        if !@ready
                            @ready = true
                            apply()

    effectTextInput: (editor) ->
        textHandler = (text) ->
            # word counter
            elements.counter.innerText = text.length - ((text.match /\s/g) || []).length

            # auto title
            matches = text.match /\s*([\S ]+)/
            title = if matches then matches[1] else '...'
            title = (title.substring 0, 20) + '...' if title.length > 20
            document.title = title

            # empty text
            editor.innerText = '' if text == "\n"

        editor.innerText = localStorage.getItem 'draft'
        textHandler editor.innerText

        editor.addEventListener 'input', ->
            localStorage.setItem 'draft', this.innerText
            textHandler this.innerText

    effectKeyPressTone: (editor) ->
        isTypingText = (e) ->
            return no if e.isComposing
            return yes if e.code.match /^(Key[a-z]|Digit[0-9]|Enter|Space|Backspace)$/i
            return yes if e.code.match /^(Backquote|Quote|Slash|Backslash|Minus|Equal|BracketLeft|BracketRight|Comma|Semicolon|Period)$/i
            no

        editor.addEventListener 'keydown', (e) =>
            @player() if @player? && isTypingText e

    effectPastePlainText: (editor) ->
        supportPlainText = yes

        try
            editor.contentEditable = 'plaintext-only'
            supportPlainText = editor.contentEditable == 'plaintext-only'
        catch
            supportPlainText = no

        if not supportPlainText
            editor.addEventListener 'paste', (e) ->
                e.preventDefault()

                text = (e.originalEvent || e).clipboardData.getData 'text/plain'
                text = text.replace /\r\n/g, "\n"
                    .replace /\t/g, '    '
                document.execCommand 'insertText', false, text

    effectHideCursor: ->
        lastMove = 0;
        configOpen = no

        elements.config.addEventListener 'toggle', ->
            configOpen = this.hasAttribute 'open'

        ['mousemove', 'mousedown', 'touch'].forEach (type) ->
            window.addEventListener type, (e) ->
                if e.type != 'mousemove' || (e.movementX > 2 || e.movementY > 2)
                    lastMove = Date.now()
                    document.body.classList.remove 'silence'

        setInterval ->
            if lastMove != 0 && !configOpen && Date.now() - lastMove >= 2000
                document.body.classList.add 'silence'
        , 500


# init component
editor = new Editor
config = new Config editor