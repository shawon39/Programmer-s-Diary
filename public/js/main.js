

$(document).ready(function() {
    $('.delete-Todo').on('click', function() {
        var id = $(this).data('id');
        //console.log(id);
        var url = '/deleteTodo/'+id;
        //console.log(url);

        if(confirm('Delete Item ?')) {
            $.ajax({
                url: url,
                type:'DELETE',
                success: function(result){
                    console.log('Deleting Item...');
                    window.location.href='/timeline';
                },
                error: function(err) {
                    console.log(err);
                }
            });
        }
    });
});
