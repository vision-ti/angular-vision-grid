'use strict';

angular.module('vision.grid.util')

    /**
     * UtilGrid com labelFunction's úteis
     */
    .factory('vsGridUtil', ['$filter', 'UtilArray',

        function ($filter, UtilArray) {

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
            var vsGridUtil = {

                getDefined: function(value, elseValue){
                    return angular.isDefined(value) ? value : elseValue;
                },

                evaluate: function (data, expression) {

                    var expressionPath = expression.split(".");

                    var itemData = data;
                    for (var i in expressionPath) {
                        if (itemData != null)
                            itemData = itemData[expressionPath[i]];
                    }

                    return itemData;
                },

                /**
                 * GridColumnDecimal.labelFunction
                 * @param item
                 * @param column
                 * @returns {string}
                 */
                formatDecimal: function (item, column) {
                    var valueOf = this.evaluate(item, column.fieldName);
                    if (angular.isDefined(valueOf))
                        return formatNumber(column.useSymbol, valueOf, column.centsLimit, column.decimalSeparator, column.thousandsSeparator);
                    else
                        return '';
                },

                /**
                 * GridColumnDate.labelFunction
                 * @param item
                 * @param column
                 */
                formatDate: function (item, column) {
                    var valueOf = this.evaluate(item, column.fieldName);
                    if (typeof valueOf == 'string')
                        valueOf = new Date(valueOf);
                    return $filter('date')(valueOf, column.format);
                },

                /**
                 * GridColumnEnum.labelFunction
                 * @param item
                 * @param column
                 */
                formatEnum: function (item, column) {
                    var valueOf = this.evaluate(item, column.fieldName);
                    valueOf = UtilArray.getValueOfLabelField(column.provider, column.labelField, column.labelValue, valueOf);
                    return valueOf == null ? '' : String(valueOf);
                },

                /**
                 * GridColumnIdentity.labelFunction
                 * @param item
                 * @param column
                 */
                formatEntity: function (item, column) {
                    return this.evaluate(item, [column.fieldName.split('.')[0], column.labelField].join('.'));
                }
            };

            return vsGridUtil;
        }]);