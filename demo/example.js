var exampleApp = angular.module('exampleApp', ['ngSanitize', 'vision.grid']);

function TesteController($scope){

    $scope.alunos = [
        {id: 1, nome: 'Felipe', telefone: '3281-8761', cidade: 'Goiânia', data: new Date()},
        {id: 2, nome: 'Lucas', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 3, nome: 'Daniel', telefone: '3281-8762', cidade: 'Goiânia', data: new Date()},
        {id: 4, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 5, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()},
        {id: 6, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', cor: '#FF0000', data: new Date()},
        {id: 7, nome: 'Jordana', telefone: '3281-8765', cidade: 'Goiânia', data: new Date()}
    ];

    $scope.init = function($ctrl){
        var coluna = new GridColumn('Código', 'id', '90px');
        coluna.editable = true;
        $ctrl.addColumn(coluna);

        coluna = new GridColumn('Nome', 'nome', '300px');
        coluna.editable = true;
        coluna.labelFunction = $scope.lblNome;
        $ctrl.addColumn(coluna);

        coluna = new GridColumn('Cidade', 'cidade');
        coluna.editable = true;
        $ctrl.addColumn(coluna);

        coluna = new GridColumnDate('Data', 'data', '100px');
        $ctrl.addColumn(coluna);
    }

    $scope.dgAlunosCellBlur = function($data){
        console.log($data);
    }
}