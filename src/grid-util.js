'use strict';

angular.module('vision.grid.util', [])

/**
 * UtilGrid com labelFunction's úteis
 */
    .factory('vsGridUtil', ['$filter', '$locale',

        function ($filter, $locale) {

            //private
            var formatNumber = function (useSymbol, number, centsLimit, centsSeparator, thousands_sep) {

                var symbol = "";

                if (useSymbol)
                    symbol = $locale.NUMBER_FORMATS.CURRENCY_SYM + " ";

                if (thousands_sep == undefined)
                    thousands_sep = $locale.NUMBER_FORMATS.GROUP_SEP;

                if (centsSeparator == undefined)
                    centsSeparator = $locale.NUMBER_FORMATS.DECIMAL_SEP;

                var n = number,
                    c = isNaN(centsLimit) ? 2 : Math.abs(centsLimit), //if decimal is zero we must take it, it means user does not want to show any decimal
                    d = centsSeparator || '.', //if no decimal separator is passed we use the dot as default decimal separator (we MUST use a decimal separator)

                    t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep, //if you don't want to use a thousands separator you can pass empty string as thousands_sep value

                    sign = (n < 0) ? '-' : '',

                //extracting the absolute value of the integer part of the number and converting to string
                    i = parseInt(n = Math.abs(n).toFixed(c)) + '',
                    j;

                j = ((j = i.length) > 3) ? j % 3 : 0;
                return symbol + sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
            };

            //Os labelFunction's abaixo estão sendo setados na grid directive
            var vsGridUtil = function() {};

            /**
             *  Procura o item pelo valor do labelValue e retorna o valor referente ao labelField
             */
            vsGridUtil.getValueOfLabelField = function(array, labelField, labelValue, value)
            {
                if (value != null)
                {
                    var item = vsGridUtil.getItemByPropertyValue(array, labelValue, value);
                    return vsGridUtil.evaluate(item, labelField);
                }
                else
                    return null;
            };

            /**
             *  Retorna o item do Array pelo valor da propriedade do item
             *  Para propriedade String os acentos e espaços são ignorados
             *  <code>
             * 	Ex:<br>
             * 	 	listaDePessoas;<br>
             *  	item = pessoa;<br>
             * 		propridade = id;
             *		getItemIndexByPropertyValue(listaDePessoas, id, 12);<br>
             *  	Retorna a pessoa dentro da lista que tiver o id exatamente igual à 12;<br>
             *  </code>
             */
            vsGridUtil.getItemByPropertyValue = function(array, property, value)
            {
                var index = vsGridUtil.getItemIndexByPropertyValue(array, property, value);
                return index == -1 ? null : array[index];
            };

            /**
             *  Retorna o índice do item do Array pelo valor da propriedade do item<br>
             *  Para propriedade String os acentos e espaços são ignorados
             *  <code>
             * 	Ex:<br>
             * 	 	listaDePessoas;<br>
             *  	item = pessoa;<br>
             * 		propridade = id;
             *		getItemIndexByPropertyValue(listaDePessoas, id, 12);<br>
             *  	Retorna índice da pessoa dentro da lista que tiver o id exatamente igual à 12;<br>
             * </code>
             */
            vsGridUtil.getItemIndexByPropertyValue = function(array, property, value)
            {
                if (Util.isValorPreenchido(value) && array != null)
                {
                    var beanValue;
                    var item;
                    for (var i = 0; i < array.length; i++){
                        item = array[i];
                        beanValue = vsGridUtil.evaluate(item, property);
                        beanValue = beanValue != null ? String(beanValue).toLowerCase() : null;
                        value = String(value).toLowerCase();
                        if (beanValue == value){
                            return i;
                        }
                    }
                }
                return -1;
            };

            vsGridUtil.getDefined = function (value, elseValue) {
                return angular.isDefined(value) ? value : elseValue;
            };

            vsGridUtil.evaluate = function (data, expression) {

                var expressionPath = expression.split(".");

                var itemData = data;
                for (var i in expressionPath) {
                    if (itemData != null)
                        itemData = itemData[expressionPath[i]];
                }

                return itemData;
            };

            /**
             * GridColumnDecimal.labelFunction
             * @param item
             * @param column
             * @returns {string}
             */
            vsGridUtil.formatDecimal = function (item, column) {
                var valueOf = vsGridUtil.evaluate(item, column.fieldName);
                if (angular.isDefined(valueOf))
                    return formatNumber(column.useSymbol, valueOf, column.centsLimit, column.decimalSeparator, column.thousandsSeparator);
                else
                    return '';
            };

            /**
             * GridColumnDate.labelFunction
             * @param item
             * @param column
             */
            vsGridUtil.formatDate = function (item, column) {
                var valueOf = vsGridUtil.evaluate(item, column.fieldName);
                if (typeof valueOf == 'string')
                    valueOf = new Date(valueOf);
                return $filter('date')(valueOf, column.format);
            };

            /**
             * GridColumnEnum.labelFunction
             * @param item
             * @param column
             */
            vsGridUtil.formatEnum = function (item, column) {
                var valueOf = vsGridUtil.evaluate(item, column.fieldName);
                valueOf = vsGridUtil.getValueOfLabelField(column.provider, column.labelField, column.labelValue, valueOf);
                return valueOf == null ? '' : String(valueOf);
            };

            /**
             * GridColumnIdentity.labelFunction
             * @param item
             * @param column
             */
            vsGridUtil.formatEntity = function (item, column) {
                return vsGridUtil.evaluate(item, [column.fieldName.split('.')[0], column.labelField].join('.'));
            };

            return vsGridUtil;
        }]);