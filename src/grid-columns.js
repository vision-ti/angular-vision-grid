'use strict';

/**
 * GridColumn class definition
 * @constructor
 */
var GridColumn = function(headerText, fieldName, width){

    this.headerText = headerText;
    this.fieldName = fieldName;
    this.sortable = true;

    //function(item, column)
    this.labelFunction = undefined;

    //path do arquivo .html
    this.headerRenderer = undefined;

    //path do arquivo .html
    this.itemRenderer = undefined;
    this.editable = false;
    this.itemEditor = undefined;

    //px or %
    this.width = width;

    //left, center, right
    this.headerTextAlign = 'left';
    this.textAlign = 'left';
    this.visible = true;
};

/**
 * GridColumnDecimal class definition
 * @constructor
 */
var GridColumnDecimal = function(headerText, fieldName, width){

    GridColumn.call(this, headerText, fieldName, width);

    this.textAlign = 'right';
    this.centsLimit = 2;
    this.centsSeparator = ',';
    this.thousandsSeparator = '.';
    this.useSymbol = false;
};
GridColumnDecimal.prototype = new GridColumn();

/**
 * GridColumnDate class definition
 * @constructor
 */
var GridColumnDate = function(headerText, fieldName, width){
    GridColumn.call(this, headerText, fieldName, width);

    this.format = 'dd/MM/yyyy';
};
GridColumnDate.prototype = new GridColumn();

/**
 * GridColumnEnum class definition
 * @param headerText
 * @param fieldName
 * @param width
 * @constructor
 */
var GridColumnEnum = function(headerText, fieldName, width){
    GridColumn.call(this, headerText, fieldName, width);

    this.labelField = undefined;
    this.labelValue = undefined;
    this.provider = [];
};
GridColumnEnum.prototype = new GridColumn();