var exampleApp = angular.module('exampleApp', ['ngSanitize', 'vision.grid']);

function TesteController($scope){

    $scope.alunos = [
        {nome: 'Felipe Leonhardt'},
        {nome: 'Jordana Bastos de Amorim'},
        {nome: 'Lucas Bastos Leonhardt'},
        {nome: 'Daniel Bastos Leonhardt'}
    ];

    $scope.init = function($ctrl){
        var coluna = new GridColumn('Nome', 'nome');
        $ctrl.addColumn(coluna);
    }
}