'use strict';

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

                    scope.gridName = vsGridUtil.getDefined(attrs.name, 'grid');

                    //Cria uma referência do ctrl no scope do elemento parent
                    angular.element(element[0].parentElement).scope()[scope.gridName] = ctrl;

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
                    if (scope.virtualScrollEnabled) {
                        scope.styleContainer.height = attrs.height;
                        scope.styleContainerInner.height = (height - headerHeight) + 'px';
                    }

                    var innerContainer = element.find('.fixed-table-container-inner');
                    var headerBar = null, footerBar = null;
                    var tableHeader = element.find('.table-header');
                    var spinner = element.find('#vs-grid-spinner');

                    var raw = innerContainer[0];

                    var rangeStart, rangeEnd;
                    innerContainer.scroll(function (event) {

                        //Header scroll(horizontal)
                        if (headerBar == null && footerBar == null) {
                            headerBar = element.find('.vs-header-bar');
                            footerBar = element.find('.vs-footer-bar');
                        } else {
                            headerBar.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});
                            footerBar.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});
                        }
                        tableHeader.offset({ left: (-1 * this.scrollLeft) + innerContainer.offset().left});

                        if (scope.virtualScrollEnabled) {
                            //Virtual scroll(vertical)
                            rangeStart = Math.ceil(raw.scrollTop / rowHeight);
                            rangeEnd = Math.ceil((raw.scrollTop + raw.offsetHeight) / rowHeight);
                            if (raw.scrollTop + raw.offsetHeight <= viewPortHeight) {
                                scope.tablePortStyle.top = raw.scrollTop + 'px';
                                scope.$apply(scope.renderProvider(scope.gridProvider.slice(rangeStart, rangeEnd)));
                            }
                        }

                    });

                    /**
                     * Return virtual rows lenght to render rows with no-data, for visual aspect
                     * @returns {number}
                     */
                    var getVirtualRowsLength = function () {
                        return scope.virtualScrollEnabled ? Math.ceil((height - headerHeight) / rowHeight) : scope.gridProvider.length;
                    };

                    /**
                     * Update virtual scroll height
                     * @param height
                     */
                    scope.updateHeight = function (value) {

                        height = value;
                        scope.styleContainer.height = height + 'px';
                        scope.styleContainerInner.height = (height - headerHeight) + 'px';

                        scope.renderProvider(scope.gridProvider, getVirtualRowsLength());
                        scope.$apply();
                    };

                    /**
                     * Adiciona as rows a serem renderizadas
                     */
                    scope.renderProvider = function (rows, length) {

                        if (length == undefined) {
                            length = rows.length;
                        }

                        scope.renderedProvider.length = length;
                        for (var i = 0; i < length || i < minRows; i++) {
                            if (angular.isDefined(rows[i])) {
                                scope.renderedProvider[i] = rows[i];
                            } else {
                                scope.renderedProvider[i] = {};
                            }
                        }
                    };

                    /**
                     * Atualiza o gridProvider
                     */
                    scope.$watch('provider', function (newValue, oldValue) {

                        clearSelection();
                        //Realiza a cópia do provider
                        scope.gridProvider = [];

                        if (scope.provider != null && scope.provider != undefined)
                            angular.extend(scope.gridProvider, scope.provider);

                        //$animate.enter(spinner, element);

                        //Faz o cálculo do height da viewPort para virtual scroll
                        if (scope.virtualScrollEnabled && angular.isDefined(newValue) && newValue.length > 0) {
                            viewPortHeight = newValue.length * rowHeight;
                            scope.viewPortStyle.height = viewPortHeight + 'px';
                        }

                        if (oldValue == undefined || newValue == undefined || newValue.length != oldValue.length) {
                            $timeout(function () {
                                raw.scrollTop = 0;
                                innerContainer.scroll();
                            });
                        }
                    }, true);

                    /**
                     * Atualiza o renderedProvider
                     */
                    scope.$watch('gridProvider', function (value) {

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
                    scope.getRowStyle = function (item) {

                        var rowStyle = {};
                        rowStyle.height = scope.rowHeight;

                        //Desenha a cor de fundo da row por uma propriedade de um item do provider
                        if (angular.isDefined(scope.rowColorField)) {
                            var color = vsGridUtil.evaluate(item, scope.rowColorField);
                            if (angular.isDefined(color))
                                rowStyle.backgroundColor = color;
                        }

                        //Desenha a cor de fundo de acordo com uma function
                        if (angular.isDefined(attrs.rowColorFunction)) {
                            var color = scope.rowColorFunction({$item: item});
                            if (angular.isDefined(color))
                                rowStyle.backgroundColor = color;
                        }

                        return rowStyle;
                    };

                    /**
                     * Configura o style da coluna
                     * @param column
                     */
                    scope.getColumnStyle = function (column, position) {

                        var columnStyle = {};
                        if (position == 'header') {
                            columnStyle.textAlign = column.headerTextAlign;
                        } else {
                            columnStyle.textAlign = column.textAlign;
                        }

                        if (angular.isDefined(column.width))
                            columnStyle.width = column.width;
                        else {
                            columnStyle.minWidth = '80px';
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
                    scope.addColumnAt = function (index, column) {

                        if (column instanceof GridColumnDecimal && !angular.isDefined(column.labelFunction)) {
                            column.labelFunction = vsGridUtil.formatDecimal;
                        }

                        if (column instanceof GridColumnDate && !angular.isDefined(column.labelFunction)) {
                            column.labelFunction = vsGridUtil.formatDate;
                        }

                        if (column instanceof GridColumnEnum && !angular.isDefined(column.labelFunction)) {
                            column.labelFunction = vsGridUtil.formatEnum;
                        }

                        /**
                         * Evento disparado no $rootScope para configuração
                         * de labelFunction de implementações de outras colunas
                         */
                        scope.$emit('grid:addColumn', column);
                        scope.columns.splice(index, 0, column);
                    };

                    /**
                     * Retorna a String do item para exibir na grid
                     * @param item
                     * @param column
                     * @returns {*}
                     */
                    scope.getItem = function ($index, item, column) {
                        var valueOf;

                        if (angular.isFunction(column.labelFunction)) {
                            valueOf = column.labelFunction(item, column, $index);
                        } else
                            valueOf = vsGridUtil.evaluate(item, column.fieldName);

                        return valueOf != undefined ? valueOf.toString() : '';
                    };

                    /**
                     * Verifica se foi informado o headerRenderer na coluna
                     * @param column
                     * @returns {boolean|*}
                     */
                    scope.isHeaderRenderer = function (column) {
                        return angular.isDefined(column.headerRenderer);
                    };

                    /**
                     * Verifica se tem um itemRenderer informado
                     * @param column
                     * @returns {boolean}
                     */
                    scope.isItemRenderer = function (item, column) {
                        return angular.isDefined(column.itemRenderer);
                    };

                    /**
                     * Dispara o double-click
                     */
                    scope.selectItemDblclick = function (item, column) {

                        scope.selectItem(item, column);

                        if (attrs.itemDoubleClick) {
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

                        if (!angular.isDefined(item))
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
                            else {
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
                    var getData = function () {
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
                    var clearSelection = function () {
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
                            return 'selected-item';
                        } else
                            return '';
                    };

                    /**
                     * onKeyDown
                     * @param $event
                     */
                    scope.onKeyDown = function ($event) {

                        if ($event.keyCode == 38 || $event.keyCode == 40) {

                            if (virtualIndex == undefined)
                                virtualIndex = -1;

                            //up key
                            if ($event.keyCode == 38) {

                                if (virtualIndex < 0) {
                                    virtualIndex = 0
                                } else if (virtualIndex > 0) {
                                    virtualIndex--;
                                }
                            }

                            //down key
                            if ($event.keyCode == 40) {

                                if (virtualIndex > scope.gridProvider.length) {
                                    virtualIndex = scope.gridProvider.length;
                                } else if (virtualIndex < scope.gridProvider.length) {
                                    virtualIndex++;
                                }
                            }

                            scope.selectItem(scope.gridProvider[virtualIndex], scope.selectedColumn);
                        }

                        if (scope.selectionMode == 'multiple') {
                            scope.shiftKey = $event.shiftKey;
                            scope.ctrlKey = $event.ctrlKey || $event.keyCode == commandKeyCode;
                        }

                        scope.$emit(scope.gridName + ':onKeyDown', $event);
                    };

                    /**
                     * onKeyUp
                     * @param $event
                     */
                    scope.onKeyUp = function ($event) {
                        if (scope.selectionMode == 'multiple') {
                            scope.shiftKey = $event.shiftKey;
                            scope.ctrlKey = $event.ctrlKey;
                            if ($event.keyCode == commandKeyCode)
                                scope.ctrlKey = false;
                        }

                        scope.$emit(scope.gridName + ':onKeyUp', $event);
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
                        scope.gridProvider = $filter('orderBy')(scope.provider, scope.sort.sortingField, scope.sort.reverse);
                    };

                    /**
                     * Verifica se tem headerBar
                     * @returns {boolean|*}
                     */
                    scope.hasHeaderBar = function () {
                        return angular.isDefined(attrs.headerBar);
                    };

                    /**
                     * Verifica se tem footerBar
                     * @returns {boolean|*}
                     */
                    scope.hasFooterBar = function () {
                        return angular.isDefined(attrs.footerBar);
                    };

                    /**
                     * Style header-footer
                     */
                    var headerFooterStyle = {};
                    scope.getHeaderFooterStyle = function () {
                        headerFooterStyle.width = innerContainer[0].scrollWidth;
                        return headerFooterStyle;
                    };

                    //Função disparada pelo expandColumnRenderer
                    scope.openCloseExpandRow = function (item) {

                        item.expandRowOpened = !item.expandRowOpened;

                        if (scope.toggleExpandRow) {
                            angular.forEach(scope.renderedProvider, function (value, index) {
                                if (value != item)
                                    value.expandRowOpened = false;
                            });
                        }
                    };

                    scope.expandRow = undefined;

                    /**
                     * Configura a expandRow
                     */
                    scope.setExpandRowUrl = function (expandRowUrl) {

                        scope.expandRow = expandRowUrl;
                        attrs.expandColumnRenderer = vsGridUtil.getDefined(scope.expandColumnRenderer, 'template/vision/grid/expandColumnRenderer.html');

                        var expandColumn = new GridColumn();
                        expandColumn.fieldName = 'expandColumn';
                        expandColumn.width = '70px';
                        expandColumn.textAlign = 'center';
                        expandColumn.itemRenderer = attrs.expandColumnRenderer;

                        if (angular.isDefined(scope.expandColumnHeader)) {
                            expandColumn.headerText = scope.expandColumnHeader;
                        }

                        scope.addColumnAt(0, expandColumn);
                    };

                    if (angular.isDefined(scope.expandRowUrl))
                        scope.setExpandRowUrl(scope.expandRowUrl);

                    /**
                     * Dispara o método config para inicializar as colunas
                     */
                    if (angular.isDefined(attrs.init)) {
                        scope.init({$ctrl: ctrl});
                        scope.$emit(scope.gridName + ':init', {$ctrl: ctrl});
                    }

                    //$timeout(function(){
                    //  $animate.leave(spinner);
                    //});

                }
            }
        }
    ])

    .run(["$templateCache", function($templateCache) {

        $templateCache.put("template/vision/grid/vision-grid.html",

            "<div class=\"row\">\n"+
            "    <div class=\"vs-grid col-sm-12\">\n"+
            "        <div class=\"header-footer\" ng-if=\"hasFooterBar()\">\n"+
            "            <div class=\"vs-header-bar\" ng-include=\"headerBar\" ng-style=\"getHeaderFooterStyle()\"></div>\n"+
            "        </div>\n"+
            "        <div class=\"fixed-table-container\" ng-style=\"styleContainer\" class=\"table table-bordered\" tabindex=\"0\" ng-keydown=\"onKeyDown($event)\" ng-keyup=\"onKeyUp($event)\">\n"+
            "            <div class=\"table-header\">\n"+
            "                <table class=\"table table-vision\">\n"+
            "                    <thead>\n"+
            "                        <tr>\n"+
            "                           <th ng-repeat=\"column in columns track by $index\"\n"+
            "                               class=\"vs-grid-column\"\n"+
            "                               ng-show=\"column.visible\"\n"+
            "                               ng-style=\"getColumnStyle(column, 'header')\"\n"+
            "                               ng-class=\"{first: $first}\">\n"+
            "                                   <div ng-style=\"headerStyle\" ng-show=\"isHeaderRenderer(column)\" ng-include=\"column.headerRenderer\"></div>\n"+
            "                                   <div ng-style=\"headerStyle\" ng-show=\"!isHeaderRenderer(column)\">\n"+
            "                                       <span ng-show=\"!column.sortable\" ng-bind=\"column.headerText\"></span>\n"+
            "                                       <column-sort></column-sort>\n"+
            "                                   </div>\n"+
            "                            </th>\n"+
            "                         </tr>\n"+
            "                    </thead>\n"+
            "               </table>\n"+
            "            </div>\n"+
            "            <div class=\"fixed-table-container-inner\" scrollbar ng-style=\"styleContainerInner\">\n"+
            "                <div ng-style=\"viewPortStyle\" style=\"position: relative; display: block;\">\n"+
            "                    <table class=\"table table-vision\" ng-style=\"tablePortStyle\">\n"+
            "                        <tbody>\n"+
            "                           <!--tabindex=\"{{$parent.$parent.$index}}{{$index+1}}\"-->\n"+
            "                           <tr ng-repeat-start=\"item in renderedProvider track by $index\"\n"+
            "                               ng-class=\"{rendered:item.isRendered}\"\n"+
            "                               ng-style=\"getRowStyle(item)\">\n"+
            "                               <td ng-repeat=\"column in columns track by $index\"\n"+
            "                                   ng-show=\"column.visible\"\n"+
            "                                   ng-mousedown=\"selectItem(item, column)\"\n"+
            "                                   ng-dblclick=\"selectItemDblclick(item, column)\"\n"+
            "                                   ng-class=\"selectClass(item)\"\n"+
            "                                   ng-style=\"getColumnStyle(column)\">\n"+
            "                                     <span ng-show=\"!isItemRenderer(item, column)\" ng-bind-html=\"getItem($parent.$index, item, column)\"></span>\n"+
            "                                     <div ng-show=\"isItemRenderer(item, column)\" ng-include=\"column.itemRenderer\"></div>\n"+
            "                               </td>\n"+
            "                           </tr>\n"+
            "                           <tr class=\"actions text-left\" ng-show=\"item.expandRowOpened\" ng-repeat-end>\n"+
            "                               <td ng-include=\"expandRow\" colspan=\"{{columns.length}}\" ></td>\n"+
            "                           </tr>\n"+
            "                       </tbody>\n"+
            "                   </table>\n"+
            "               </div>\n"+
            "           </div>\n"+
            "       </div>\n"+
            "       <div class=\"header-footer\" ng-if=\"hasFooterBar()\">\n"+
            "           <div class=\"vs-footer-bar\" ng-include=\"footerBar\" ng-style=\"getHeaderFooterStyle()\"></div>\n"+
            "       </div>\n"+
            "   </div>\n"+
            "</div>"
        );

        $templateCache.put("template/vision/grid/column-sort.html",
            "<a ng-if=\"column.sortable\" ng-click=\"sortBy(column.fieldName)\">\n"+
            "   <span ng-bind=\"column.headerText\"></span>\n"+
            "   <i ng-class=\"selectSorterClass(column.fieldName)\"></i>\n"+
            "</a>"
        );

        $templateCache.put("template/vision/grid/expandColumnRenderer.html",
            "<a class=\"expand-row\" ng-click=\"openCloseExpandRow(item)\">\n" +
            "   <i class=\"fa\" ng-class=\"{'fa-chevron-right': !item.expandRowOpened, 'fa-chevron-down': item.expandRowOpened}\"></i>\n" +
            "</a>"
        );

    }]);