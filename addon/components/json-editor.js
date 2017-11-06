/* global JSONEditor */
import Ember from 'ember';

export default Ember.Component.extend({
  /**
  Element tag name.
  */
  tagName: 'div',
  /**
  Element classes.
  */
  classNames: ['jsoneditor-component'],

  /**
  Cached editor.
  */
  _editor: undefined,
  /**

  */
  editor: Ember.computed('options', 'json', 'raw', function() {
    var self = this;
    var editor = self.get('_editor');
    // console.log('editor', editor);
    if (Ember.isEmpty(editor)) {
      // Empty, create it.
      var container = self.$().get(0);
      // console.log('container', self.$(), container);
      if (Ember.isEmpty(container)) {
        return undefined;
      } else {
        var options = self.get('options');
        var json = self.get('json');
        var raw = self.get('raw');
        editor = new JSONEditor(container, options);
        if (raw) {
          editor.setText(json);
        } else {
          editor.set(json);
        }
        // console.log('new editor', editor);
        self.set('_editor', editor);
        return editor;
      }
    } else {
      // Editor is already created and cached.
      return editor;
    }
  }),

  /**
  JSON object.
  */
  json: {},

  /**
  Raw mode it to get and set text instead of objects to the JSON editor
  */
  raw: false,

  /**
  Object with options.
  */
  options: Ember.computed(
    'mode',
    'modes',
    '_change',
    'search',
    'history',
    'name',
    'indentation',
    'onError',
    'onEditable',
    function() {
      // console.log('options');

      var props = this.getProperties([
        'mode',
        'modes',
        '_change',
        'search',
        'history',
        'name',
        'indentation',
        'onError',
        'onEditable'
      ]);
      // Rename
      props.onChange = props._change;
      delete props._change;
      // Add reference to this component
      props.component = this;
      return props;
    }),

  /**
  Editor mode. Available values:
  'tree' (default), 'view',
  'form', 'text', and 'code'.
  */
  mode: 'tree',

  /**
  Create a box in the editor menu where the user can switch between the specified modes.
  Available values: see option mode.
  */
  modes: ['tree', 'view', 'form', 'text', 'code'],

  /**
  Callback method, triggered
  on change of contents
  */
  change: function() {
    const onChangeFunc = this.get('onChange');
    if (onChangeFunc) {
      onChangeFunc();
    }
  },

  /**
   Set a callback method triggered when an error occurs.
   Invoked with the error as first argument.
   The callback is only invoked for errors triggered by a users action.
  */
  error: function(error) {
    const onErrorFunc = this.get('onError');
    if (onErrorFunc) {
      onErrorFunc(error);
    }
  },

  /**
   Set a callback method to see if the editor should be editable.
  */
  editable: function() {
    const onEditableFunc = this.get('onEditable');
    if (onEditableFunc) {
      onEditableFunc();
    }
  },

  /**
  Editor updated JSON.
  */
  _updating: false,

  /**
  Change event handler.
  Triggers `change()` which is user defined.
  */
  _change: function() {
    // console.log('_change', this);

    var self = this.component;
    var editor = self.get('_editor');
    if (Ember.isEmpty(editor)) {
      return;
    }
    try {
      var raw = self.get('raw');
      var json = raw ? editor.getText() : editor.get();
      self.set('_updating', true);
      self.set('json', json);
      self.set('_updating', false);
      // Trigger Change event
      if (!!self.change) {
        self.change();
      }
    } catch (error) {
      self.error(error);
    }
  },

  /**
  Enable search box.
  True by default
  Only applicable for modes
  'tree', 'view', and 'form'
  */
  search: true,
  /**
  Enable history (undo/redo).
  True by default
  Only applicable for modes
  'tree', 'view', and 'form'
  */
  history: true,
  /**
  Field name for the root node.
  Only applicable for modes
  'tree', 'view', and 'form'
  */
  name: 'JSONEditor',
  /**
  Number of indentation
  spaces. 4 by default.
  Only applicable for
  modes 'text' and 'code'
  */
  indentation: 4,

  /**
  Editor observer.
  */
  editorDidChange: Ember.observer('editor', function() {
    // console.log('editorDidChange');
    var self = this;
    self.get('editor');
  }),
  // didInsertElement: function() {
  //   // console.log('didInsertElement');
  //   this.get('editor');
  // },
  /**
  See https://github.com/emberjs/ember.js/issues/10661
  and http://stackoverflow.com/a/25523850/2578205
  */
  didInsertElement: function() {
    // console.log('didInsertElement', this, controller);
    var controller = this.get('targetObject');
    // Find the key on the controller for the data passed to this component
    // See http://stackoverflow.com/a/9907509/2578205
    var propertyKey;
    var data = this.get('json');
    for ( var prop in controller ) {
        if ( controller.hasOwnProperty( prop ) ) {
             if ( controller[ prop ] === data ) {
               propertyKey = prop;
               break;
             }
        }
    }
    if (!Ember.isEmpty(propertyKey)) {
      controller.addObserver(propertyKey, this, this.jsonDidChange);
      this.set('propertyKey', propertyKey);
    }
    this.editorDidChange();
  },

  willDestroyElement: function() {
    var propertyKey = this.get('propertyKey');
    if (propertyKey) {
      var controller = this.get('targetObject');
      controller.removeObserver(propertyKey, this, this.jsonDidChange);
    }
  },

  /**
  JSON observer.
  */
  jsonDidChange: Ember.observer('json', function() {
    // console.log('jsonDidChange');
    var self = this;
    if (Ember.isEqual(self.get('_updating'), false)) {
      var editor = self.get('editor');
      var json = self.get('json');
      var raw = self.get('raw');
      if (raw) {
        editor.setText(json);
      } else {
        editor.set(json);
      }
    }
  }),

  /**
  Mode observer.
  */
  modeDidChange: Ember.observer('mode', function() {
    // console.log('modeDidChange');
    var self = this;
    var editor = self.get('editor');
    var mode = self.get('mode');
    editor.setMode(mode);
  }),

  /**
  Name observer.
  */
  nameDidChange: Ember.observer('name', function() {
    // console.log('nameDidChange');
    var self = this;
    var editor = self.get('editor');
    var name = self.get('name');
    editor.setName(name);
  }),

});
