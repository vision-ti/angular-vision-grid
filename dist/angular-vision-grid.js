/*
 * angular-vision-grid
 * http://github.com/vision-ti/angular-vision-grid
 * Version: 0.0.1 - 2014-25-09
 * License: MIT
 */

angular.module('vision.grid', ['vision.grid.util'])

/**
 * Directive para ser utilizada pela coluna ao realizar o sort
 * Útil para ser utilizada dentro de um headerRenderer customizado
 */
    .directive('columnSort', [function () {
        return {
            require: '^grid',
            restrict: 'E',
            templateUrl: 'template/vision/grid/column-sort.html'
        }
    }])

/**
 * grid
 */
    .directive('visionGrid', ['vsGridUtil', '$filter', '$timeout', '$window', '$animate',
        function (vsGridUtil, $filter, $timeout, $window, $animate) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'template/vision/grid/vision-grid.html',
                transclude: true,
                scope: {
                    init: '&',
                    provider: '=?',
                    onSelect: '&',
                    itemDoubleClick: '&',
                    height: '@',
                    selectionMode: '@',
                    headerHeight: '@',
                    rowHeight: '@',
                    rowColorFunction: '&',
                    rowColorField: '@',
                    scrollOffset: '@',
                    headerBar: '@',
                    footerBar: '@',
                    expandRowUrl: '@',
                    expandColumnHeader: '@',
                    expandColumnRenderer: '@',
                    toggleExpandRow: '=?',
                    virtualScrollEnabled: '=?',
                    minRows: '@'
                },
                controller: ['$scope', function ($scope) {

                    /**
                     * Disparado pelo grid column
                     * @param column
                     */
                    this.addColumn = function (column) {
                        this.addColumnAt($scope.columns.length, column);
                    };

                    /**
                     * Adiciona uma coluna em uma posição específica
                     * @param index
                     * @param column
                     */
                    this.addColumnAt = function (index, column) {

                        if (!angular.isDefined(column.fieldName)) {
                            throw 'When adding gridColumn, fieldName is required!';
                        }

                        $scope.addColumnAt(index, column);
                    };

                    /**
                     * Retorna a coluna pelo fieldName
                     * @param fieldName
                     */
                    this.getColumnByFieldName = function (fieldName) {
                        for (var i = 0; i < $scope.columns.length; i++) {
                            if ($scope.columns[i].fieldName == fieldName)
                                return $scope.columns[i];
                        }
                    };

                    /**
                     * Retorna a coluna pelo índice
                     * @param $index
                     * @returns {*}
                     */
                    this.getColumn = function ($index) {
                        return $scope.columns[$index];
                    };

                    /**
                     * Retorna o array das colunas
                     * @returns {Array}
                     */
                    this.getColumns = function () {
                        return $scope.columns;
                    };

                    /**
                     * Função para setar o provider manualmente no $scope da directive
                     * @param provider
                     */
                    this.setProvider = function (provider) {
                        $scope.provider = provider;
                    };

                    /**
                     * Função para obter o item selecionado da grid
                     * @return {Object}
                     */
                    this.getSelectedItem = function () {
                        return $scope.selectedItem;
                    };

                    /**
                     * Retorna a coluna selecionada
                     * @returns {*|columnSelected|getData.columnSelected}
                     */
                    this.getColumnSelected = function () {
                        return $scope.columnSelected;
                    };

                    //Update grid height and recalculate
                    this.setHeight = function (value) {
                        $scope.updateHeight(value);
                    };

                    /**
                     * Obtém o nome da grid
                     */
                    this.getGridName = function () {
                        return $scope.gridName;
                    };

                    /**
                     * Configura a expandRow
                     * @param expandRowUrl
                     */
                    this.setExpandRowUrl = function (expandRowUrl) {
                        $scope.setExpandRowUrl(expandRowUrl);
                    };

                    /**
                     * Muda o outerScope padrão que é o scope.$parent
                     * @param outerScope
                     */
                    this.setOuterScope = function (outerScope) {
                        $scope.outerScope = outerScope;
                    };
                }],
                link: function (scope, element, attrs, ctrl) {

                    var userAgent = $window.navigator.userAgent.toLowerCase();
                    var isFirefox = userAgent.indexOf('firefox') > -1;
                    var isOpera = userAgent.indexOf('opera') > -1;
                    var commandKeyCode = isFirefox ? 224 : (isOpera ? 17 : 91 /* webkit */);

                    scope.outerScope = scope.$parent;

                    //Define se a expand-row será mantida aberta
                    scope.toggleExpandRow = vsGridUtil.getDefined(scope.toggleExpandRow, true);

                    scope.gridName = vsGridUtil.getDefined(attrs.name, "grid");

                    /**
                     * Será a cópia do provider
                     * Essencial para realizar o sort na lista para que o selectedIndex seja buscado pelo provider original
                     * @type {Array}
                     */
                    scope.gridProvider = [];

                    /**
                     * ng-repeat
                     * @type {Array}
                     */
                    scope.renderedProvider = [];

                    scope.viewPortStyle = {};
                    scope.tablePortStyle = {};
                    scope.tablePortStyle.position = 'relative';

                    scope.columns = [];

                    var minRows, headerHeight, height, rowHeight, viewPortHeight;

                    // Define a quantidade mínima de linhas a serem exibidas na grid
                    scope.minRows = vsGridUtil.getDefined(scope.minRows, '0');
                    minRows = Number(scope.minRows);

                    //Seta o headerHeight
                    scope.headerHeight = vsGridUtil.getDefined(scope.headerHeight, '30px');
                    headerHeight = Number(scope.headerHeight.replace('px', ''));
                    scope.headerStyle = {};
                    scope.headerStyle.height = scope.headerHeight;
                    scope.headerStyle.lineHeight = scope.headerHeight;
                    // headerHeight

                    attrs.rowHeight = vsGridUtil.getDefined(scope.rowHeight, '30px');
                    rowHeight = Number(attrs.rowHeight.replace('px', ''));

                    //Altura da grid
                    attrs.height = vsGridUtil.getDefined(attrs.height, '300px');
                    height = Number(attrs.height.replace('px', ''));

                    scope.styleContainer = {};
                    scope.styleContainerInner = {};
                    if (scope.virtualScrollEnabled){
                        scope.styleContainer.height = attrs.height;
                        scope.styleContainerInner.height =  (height - headerHeight)  + 'px';
                    }

                    var innerContainer = element.find('.fixed-table-container-inner');
                    var headerBar = null, footerBar = null;
                    var tableHeader = element.find('.table-header');
                    var spinner = element.find('#vs-grid-spinner');

                    var raw = innerContainer[0];

                    var rangeStart, rangeEnd;
                    innerContainer.scroll(function(event){

                        //Header scroll(horizontal)
                        if (headerBar == null && footerBar == null){
                            headerBar = element.find('.vs-header-bar');
                            footerBar = element.find('.vs-footer-bar');
                        }else{
                            headerBar.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});
                            footerBar.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});
                        }
                        tableHeader.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});

                        if (scope.virtualScrollEnabled) {
                            //Virtual scroll(vertical)
                            rangeStart = Math.ceil(raw.scrollTop / rowHeight);
                            rangeEnd = Math.ceil((raw.scrollTop + raw.offsetHeight) / rowHeight);
                            if (raw.scrollTop + raw.offsetHeight <= viewPortHeight){
                                scope.tablePortStyle.top = raw.scrollTop + "px";
                                scope.$apply(scope.renderProvider(scope.gridProvider.slice(rangeStart, rangeEnd)));
                            }
                        }

                    });

                    /**
                     * Return virtual rows lenght to render rows with no-data, for visual aspect
                     * @returns {number}
                     */
                    var getVirtualRowsLength = function(){
                        return scope.virtualScrollEnabled ? Math.ceil((height - headerHeight) / rowHeight) : scope.gridProvider.length;
                    };

                    /**
                     * Update virtual scroll height
                     * @param height
                     */
                    scope.updateHeight = function(value){

                        height = value;
                        scope.styleContainer.height = height + 'px';
                        scope.styleContainerInner.height =  (height - headerHeight)  + 'px';

                        scope.renderProvider(scope.gridProvider, getVirtualRowsLength());
                        scope.$apply();
                    };

                    /**
                     * Adiciona as rows a serem renderizadas
                     */
                    scope.renderProvider = function(rows, length){

                        if (length == undefined){
                            length = rows.length;
                        }

                        scope.renderedProvider.length = length;
                        for (var i = 0; i < length || i < minRows; i++){
                            if (angular.isDefined(rows[i])) {
                                scope.renderedProvider[i] = rows[i];
                                scope.renderedProvider[i].isRendered = true;
                            }else{
                                scope.renderedProvider[i] = {};
                            }
                        }
                    };

                    /**
                     * Atualiza o gridProvider
                     */
                    scope.$watch('provider', function(newValue, oldValue){

                        clearSelection();
                        //Realiza a cópia do provider
                        scope.gridProvider = [];

                        if (scope.provider != null && scope.provider != undefined)
                            angular.extend(scope.gridProvider, scope.provider);

                        //$animate.enter(spinner, element);

                        //Faz o cálculo do height da viewPort para virtual scroll
                        if (scope.virtualScrollEnabled && vsGridUtil.isValorPreenchido(newValue) && newValue.length > 0){
                            viewPortHeight = newValue.length * rowHeight;
                            scope.viewPortStyle.height = viewPortHeight + "px";
                        }

                        if (oldValue == undefined || newValue == undefined || newValue.length != oldValue.length) {
                            $timeout(function() {
                                raw.scrollTop = 0;
                                innerContainer.scroll();
                            });
                        }
                    }, true);

                    /**
                     * Atualiza o renderedProvider
                     */
                    scope.$watch('gridProvider', function(value){

                        //Desenha as rows (desenha rows virtuais sem dados no caso de virtualScrollEnabled)
                        scope.renderProvider(scope.gridProvider, getVirtualRowsLength());

                        if (scope.gridProvider == null || scope.gridProvider.length > 0)
                            $animate.leave(spinner);
                    });

                    /**
                     * Configura o style da row
                     * @param item
                     * @returns {{}}
                     */
                    scope.getRowStyle = function(item){

                        var rowStyle = {};
                        rowStyle.height = scope.rowHeight;

                        //Desenha a cor de fundo da row por uma propriedade de um item do provider
                        if (angular.isDefined(scope.rowColorField)){
                            var color = vsGridUtil.evaluate(item, scope.rowColorField);
                            if (vsGridUtil.isValorPreenchido(color))
                                rowStyle.backgroundColor = color;
                        }

                        //Desenha a cor de fundo de acordo com uma function
                        if (angular.isDefined(attrs.rowColorFunction)){
                            var color = scope.rowColorFunction({$item: item});
                            if (vsGridUtil.isValorPreenchido(color))
                                rowStyle.backgroundColor = color;
                        }

                        return rowStyle;
                    };

                    /**
                     * Configura o style da coluna
                     * @param column
                     */
                    scope.getColumnStyle = function(column, position){

                        var columnStyle = {};
                        if (position == 'header'){
                            columnStyle.textAlign = column.headerTextAlign;
                        }else{
                            columnStyle.textAlign = column.textAlign;
                        }

                        if (angular.isDefined(column.width))
                            columnStyle.width = column.width;
                        else
                        {
                            columnStyle.minWidth = "80px";
                            columnStyle.width = 'auto !important';
                        }

                        return columnStyle;
                    };

                    /**
                     * Adiciona a coluna
                     * Private function
                     * @param index
                     * @param column
                     */
                    scope.addColumnAt = function(index, column){

                        if (column instanceof GridColumnDecimal  && !angular.isDefined(column.labelFunction)){
                            column.labelFunction = UtilGrid.formatDecimal;
                        }

                        if (column instanceof GridColumnDate  && !angular.isDefined(column.labelFunction)){
                            column.labelFunction = UtilGrid.formatDate;
                        }

                        if (column instanceof GridColumnEnum  && !angular.isDefined(column.labelFunction)){
                            column.labelFunction = UtilGrid.formatEnum;
                        }

                        /**
                         * Evento disparado no $rootScope para configuração
                         * de labelFunction de implementações de outras colunas
                         */
                        $rootScope.$broadcast('grid:addColumn', column);

                        UtilArray.addAt(scope.columns, index, column);
                    };

                    /**
                     * Retorna a String do item para exibir na grid
                     * @param item
                     * @param column
                     * @returns {*}
                     */
                    scope.getItem = function ($index, item, column) {
                        var valueOf;

                        if (item.isRendered){
                            if (angular.isFunction(column.labelFunction)) {
                                valueOf = column.labelFunction(item, column, $index);
                            } else
                                valueOf = vsGridUtil.evaluate(item, column.fieldName);
                        }

                        return vsGridUtil.isValorPreenchido(valueOf) ? valueOf.toString() : "";
                    };

                    /**
                     * Verifica se foi informado o headerRenderer na coluna
                     * @param column
                     * @returns {boolean|*}
                     */
                    scope.isHeaderRenderer = function(column){
                        return angular.isDefined(column.headerRenderer);
                    };

                    /**
                     * Verifica se tem um itemRenderer informado
                     * @param column
                     * @returns {boolean}
                     */
                    scope.isItemRenderer = function (item, column) {
                        if (item.isRendered)
                            return angular.isDefined(column.itemRenderer);
                    };

                    /**
                     * Dispara o double-click
                     */
                    scope.selectItemDblclick = function(item, column){

                        scope.selectItem(item, column);

                        if (attrs.itemDoubleClick){
                            scope.itemDoubleClick({$data: getData()});
                        }
                        scope.$emit(scope.gridName + ':itemDoubleClick', getData());
                    };

                    /**
                     * Seta o selectedItem
                     * @param item
                     */
                    scope.selectedItems = [];
                    attrs.selectionMode = vsGridUtil.getDefined(scope.selectionMode, 'single');
                    var begin, end, virtualIndex, lastIndex = -1;
                    scope.selectItem = function (item, column) {

                        scope.columnSelected = column;

                        if (!angular.isDefined(item) || !item.isRendered)
                            return;

                        scope.selectedIndex = scope.provider.indexOf(item);
                        virtualIndex = scope.gridProvider.indexOf(item);

                        scope.selectedItem = item;

                        if (scope.shiftKey) {

                            if (lastIndex == -1) {
                                lastIndex = virtualIndex;
                                scope.selectedItems = [];
                            }
                            if (lastIndex < virtualIndex) {
                                begin = lastIndex;
                                end = virtualIndex;
                            } else {
                                begin = virtualIndex;
                                end = lastIndex;
                            }

                            scope.selectedItems = scope.gridProvider.slice(begin, end + 1);

                        } else if (scope.ctrlKey) {

                            if (scope.selectedItems.indexOf(item) == -1)
                                scope.selectedItems.push(item);
                            else{
                                var indexOf = scope.selectedItems.indexOf(item);
                                scope.selectedItems.splice(indexOf, 1);
                            }

                            lastIndex = virtualIndex;
                        } else {
                            lastIndex = virtualIndex;
                            scope.selectedItems = [item];
                        }

                        if (angular.isDefined(attrs.onSelect)) {
                            //Callback function para o item selecionado
                            scope.onSelect({$data: getData()});
                        }

                        scope.$emit(scope.gridName + ':onSelect', getData());
                    };

                    /**
                     * Object com a informação do item selecionado na grid
                     * @returns {{}}
                     */
                    var getData = function(){
                        var $data = {};
                        $data.selectedIndex = scope.selectedIndex;
                        $data.selectedItem = scope.selectedItem;
                        $data.columnSelected = scope.columnSelected;
                        $data.selectedItems = scope.selectedItems;
                        return $data;
                    };

                    /**
                     * Limpa a seleção
                     * @private
                     */
                    var clearSelection = function(){
                        scope.selectedItems = [];
                        scope.selectedItem = null;
                        scope.selectedIndex = null;
                        scope.selectedColumn = null;
                    };

                    /**
                     * Ao clicar em um item atribui o class de seleção
                     * @param item
                     * @returns {string}
                     */
                    scope.selectClass = function (item) {
                        if ((item == scope.selectedItem && scope.selectionMode == 'single')
                            || (scope.selectedItems.indexOf(item) != -1 && scope.selectionMode == 'multiple')) {
                            return "selected-item";
                        } else
                            return "";
                    };

                    /**
                     * onKeyDown
                     * @param $event
                     */
                    scope.onKeyDown = function ($event) {
                        if (scope.selectionMode == 'multiple'){
                            scope.shiftKey = $event.shiftKey;
                            scope.ctrlKey = $event.ctrlKey || $event.keyCode == commandKeyCode;
                        }

                        scope.$emit(scope.gridName + ":onKeyDown", $event);
                    };

                    /**
                     * onKeyUp
                     * @param $event
                     */
                    scope.onKeyUp = function ($event) {
                        if (scope.selectionMode == 'multiple'){
                            scope.shiftKey = $event.shiftKey;
                            scope.ctrlKey = $event.ctrlKey;
                            if ($event.keyCode == commandKeyCode)
                                scope.ctrlKey = false;
                        }

                        scope.$emit(scope.gridName + ":onKeyUp", $event);
                    };

                    //Sort object
                    scope.sort = {
                        sortingField: 'id',
                        reverse: false
                    };

                    /**
                     * class style do sorter
                     * @param fieldName
                     * @returns {string}
                     */
                    scope.selectSorterClass = function (fieldName) {
                        if (fieldName == scope.sort.sortingField) {
                            return ('glyphicon glyphicon-chevron-' + ((scope.sort.reverse) ? 'down' : 'up'));
                        }
                        else {
                            return '';
                        }
                    };

                    /**
                     * Realiza o sort
                     * @param newSortingField
                     */
                    scope.sortBy = function (newSortingField) {

                        if (scope.sort.sortingField == newSortingField) {
                            scope.sort.reverse = !scope.sort.reverse;
                        }

                        scope.sort.sortingField = newSortingField;
                        scope.gridProvider = $filter("orderBy")(scope.provider, scope.sort.sortingField, scope.sort.reverse);
                    };

                    /**
                     * Verifica se tem headerBar
                     * @returns {boolean|*}
                     */
                    scope.hasHeaderBar = function(){
                        return angular.isDefined(attrs.headerBar);
                    };

                    /**
                     * Verifica se tem footerBar
                     * @returns {boolean|*}
                     */
                    scope.hasFooterBar = function(){
                        return angular.isDefined(attrs.footerBar);
                    };

                    /**
                     * Style header-footer
                     */
                    var headerFooterStyle = {};
                    scope.getHeaderFooterStyle = function(){
                        headerFooterStyle.width = innerContainer[0].scrollWidth;
                        return headerFooterStyle;
                    };

                    //Função disparada pelo expandColumnRenderer
                    scope.openCloseExpandRow = function(item){

                        item.expandRowOpened = !item.expandRowOpened;

                        if (scope.toggleExpandRow){
                            angular.forEach(scope.renderedProvider, function(value, index){
                                if (value != item)
                                    value.expandRowOpened = false;
                            });
                        }
                    };

                    scope.expandRow = undefined;

                    /**
                     * Configura a expandRow
                     */
                    scope.setExpandRowUrl = function(expandRowUrl) {

                        scope.expandRow = expandRowUrl;
                        attrs.expandColumnRenderer = vsGridUtil.getDefined(scope.expandColumnRenderer, 'vision/templates/grid/expandColumnRenderer.html');

                        var expandColumn = new GridColumn();
                        expandColumn.fieldName = 'expandColumn';
                        expandColumn.width = '70px';
                        expandColumn.textAlign = 'center';
                        expandColumn.itemRenderer = attrs.expandColumnRenderer;

                        if (angular.isDefined(scope.expandColumnHeader)){
                            expandColumn.headerText = scope.expandColumnHeader;
                        }

                        scope.addColumnAt(0, expandColumn);
                    };

                    if (vsGridUtil.isValorPreenchido(scope.expandRowUrl))
                        scope.setExpandRowUrl(scope.expandRowUrl);

                    /**
                     * Dispara o método config para inicializar as colunas
                     */
                    if (angular.isDefined(attrs.init)){
                        scope.init({$ctrl: ctrl});
                        $timeout(function(){
                            scope.$emit(scope.gridName + ':init', ctrl);
                        });
                    }

                    //$timeout(function(){
                    //  $animate.leave(spinner);
                    //});

                }
            }
        }
    ])

    .run(["$templateCache", function ($templateCache) {

        $templateCache.put("template/vision/grid/vision-grid.html",

                "<div class=\"row\">\n" +
                "    <div class=\"vs-grid col-sm-12\">\n" +
                "        <div class=\"header-footer\" ng-if=\"hasFooterBar()\">\n" +
                "            <div class=\"vs-header-bar\" ng-include=\"headerBar\" ng-style=\"getHeaderFooterStyle()\"></div>\n" +
                "        </div>\n" +
                "        <div class=\"fixed-table-container\" ng-style=\"styleContainer\" class=\"table table-bordered\" tabindex=\"0\" ng-keydown=\"onKeyDown($event)\" ng-keyup=\"onKeyUp($event)\">\n" +
                "            <div class=\"table-header\">\n" +
                "                <table class=\"table table-vision\">\n" +
                "                    <thead>\n" +
                "                        <tr>\n" +
                "                           <th ng-repeat=\"column in columns track by $index\"\n" +
                "                               class=\"vs-grid-column\"\n" +
                "                               ng-show=\"column.visible\"\n" +
                "                               ng-style=\"getColumnStyle(column, 'header')\"\n" +
                "                               ng-class=\"{first: $first}\">\n" +
                "                                   <div ng-style=\"headerStyle\" ng-show=\"isHeaderRenderer(column)\" ng-include=\"column.headerRenderer\"></div>\n" +
                "                                   <div ng-style=\"headerStyle\" ng-show=\"!isHeaderRenderer(column)\">\n" +
                "                                       <span ng-show=\"!column.sortable\" ng-bind=\"column.headerText\"></span>\n" +
                "                                       <column-sort></column-sort>\n" +
                "                                   </div>\n" +
                "                            </th>\n" +
                "                         </tr>\n" +
                "                    </thead>\n" +
                "               </table>\n" +
                "            </div>\n" +
                "            <div class=\"fixed-table-container-inner\" scrollbar ng-style=\"styleContainerInner\">\n" +
                "                <div ng-style=\"viewPortStyle\" style=\"position: relative; display: block;\">\n" +
                "                    <table class=\"table table-vision\" ng-style=\"tablePortStyle\">\n" +
                "                        <tbody>\n" +
                "                           <!--tabindex=\"{{$parent.$parent.$index}}{{$index+1}}\"-->\n" +
                "                           <tr ng-repeat-start=\"item in renderedProvider track by $index\"\n" +
                "                               ng-class=\"{rendered:item.isRendered}\"\n" +
                "                               ng-style=\"getRowStyle(item)\">\n" +
                "                               <td ng-repeat=\"column in columns track by $index\"\n" +
                "                                   ng-show=\"column.visible\"\n" +
                "                                   ng-mousedown=\"selectItem(item, column)\"\n" +
                "                                   ng-dblclick=\"selectItemDblclick(item, column)\"\n" +
                "                                   ng-class=\"selectClass(item)\"\n" +
                "                                   ng-style=\"getColumnStyle(column)\">\n" +
                "                                     <span ng-show=\"!isItemRenderer(item, column)\" ng-bind-html=\"getItem($parent.$index, item, column)\"></span>\n" +
                "                                     <div ng-show=\"isItemRenderer(item, column)\" ng-include=\"column.itemRenderer\"></div>\n" +
                "                               </td>\n" +
                "                           </tr>\n" +
                "                           <tr class=\"actions text-left\" ng-show=\"item.expandRowOpened\" ng-repeat-end>\n" +
                "                               <td ng-include=\"expandRow\" colspan=\"{{columns.length}}\" ></td>\n" +
                "                           </tr>\n" +
                "                       </tbody>\n" +
                "                   </table>\n" +
                "               </div>\n" +
                "           </div>\n" +
                "       </div>\n" +
                "       <div class=\"header-footer\" ng-if=\"hasFooterBar()\">\n" +
                "           <div class=\"vs-footer-bar\" ng-include=\"footerBar\" ng-style=\"getHeaderFooterStyle()\"></div>\n" +
                "       </div>\n" +
                "   </div>\n" +
                "</div>"
        );

        $templateCache.put("template/vision/grid/column-sort.html",
                "<a ng-if=\"column.sortable\" ng-click=\"sortBy(column.fieldName)\">\n" +
                "   <span ng-bind=\"column.headerText\"></span>\n" +
                "   <i ng-class=\"selectSorterClass(column.fieldName)\"></i>\n" +
                "</a>"
        );

        $templateCache.put("template/vision/grid/expandColumnRenderer.html",
                "<a class=\"expand-row\" ng-click=\"openCloseExpandRow(item)\">\n" +
                "   <i class=\"fa\" ng-class=\"{'fa-chevron-right': !item.expandRowOpened, 'fa-chevron-down': item.expandRowOpened}\"></i>\n" +
                "</a>"
        );

    }]);


angular.module('vision.grid.util', [])

/**
 * UtilGrid com labelFunction's úteis
 */
    .factory('vsGridUtil', ['$filter',

        function ($filter) {

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


/**
 * GridColumn class definition
 * @constructor
 */
var GridColumn = function (headerText, fieldName, width) {

    this.headerText = headerText;
    this.fieldName = fieldName;
    this.sortable = true;

    //function(item, column)
    this.labelFunction = undefined;

    //path do arquivo .html
    this.headerRenderer = undefined;

    //path do arquivo .html
    this.itemRenderer = undefined;
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
var GridColumnDecimal = function (headerText, fieldName, width) {

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
var GridColumnDate = function (headerText, fieldName, width) {
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
var GridColumnEnum = function (headerText, fieldName, width) {
    GridColumn.call(this, headerText, fieldName, width);

    this.labelField = undefined;
    this.labelValue = undefined;
    this.provider = [];
};
GridColumnEnum.prototype = new GridColumn();