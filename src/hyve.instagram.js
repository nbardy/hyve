(function(root) {
    var hyve = (typeof require == 'function' && !(typeof define == 'function' && define.amd)) ? require('../src/hyve.core.js') : root.hyve

    hyve.feeds['instagram'] = {
        methods : ['friends', 'search', 'nearby'],
        interval : 3000,
        interval_friends : 10000,
        access_token : '',
        feed_urls : {
            friends: 'https://api.instagram.com/v1/users/self/feed?limit=25&type=post{{ access_token }}{{ since }}{{#&callback=#callback}}',
            search: 'https://api.instagram.com/v1/tags/{{query}}/media/recent?limit=25&type=post{{ access_token }}{{ since }}{{#&callback=#callback}}',
            nearby: 'https://api.instagram.com/v1/media/search{{query}}&limit=25&type=post{{ access_token }}{{ since }}{{#&callback=#callback}}'
        },
        format_url : function(query){
            var since_arg = ''
            if (this.since){
               since_arg = '&min_id='+this.since
            }
            // Location requires a different query format
            if(query['latitude']) {
                query = 
                    '?lat='+query['latitude']+
                    '&lng='+query['longitude']+
                    '&distance='+query['radius']
                
                
               
            }
            return {
                      query: query
                    , since: since_arg
                    , access_token: '&access_token=' + this.access_token
            }
        },
        parsers: {
            search: parseData,
            friends: parseData,
            nearby: geoParse
        }
    }

function parseData(data, query, callback){
    if (data && data.data && data.data.length > 0){
        if(data.pagination && data.pagination.next_min_id) {
            since = data.pagination.next_min_id
        } else {
            since = data.data[0].id
        }

        hyve.feeds.instagram.since = since

        data.data.forEach(function(item){

            var text = undefined;

            if (item.caption) text = item.caption.text

            hyve.process({
                'service' : 'instagram',
                'type' : 'image',
                'query' : query,
                'user' : {
                    'id' : item.user.id,
                    'name' : item.user.username,
                    'real_name' : item.user.full_name,
                    'avatar' : item.user.profile_picture
                },
                'id' : item.id,
                'date' : item.created_time,
                'text' : text,
                'thumbnail' : item.images.standard_resolution.url,
                'comments' : item.comments.count,
                'source' : item.link,
                'likes' : item.likes.count,
                'weight' : item.likes.count + item.comments.count
            },callback)

        },this)
    }
}

function geoParse(data, query, callback) {
   console.log('geoParse');
    if (data && data.data && data.data.length > 0) {
   console.log('passed bool 1');
        if (!this.items_seen) this.items_seen = {}

        data.data.forEach(function(item)  {
            id = item.id

            if (!this.items_seen[id]) {
                this.items_seen[id] = true

                var text = undefined;
                if (item.caption) text = item.caption.text
                
                hyve.process({
                    'service' : 'instagram',
                    'type' : 'image',
                    'query' : query,
                    'user' : {
                        'id' : item.user.id,
                        'name' : item.user.username,
                        'real_name' : item.user.full_name,
                        'avatar' : item.user.profile_picture
                    },
                    'id' : item.id,
                    'date' : item.created_time,
                    'text' : text,
                    'thumbnail' : item.images.standard_resolution.url,
                    'comments' : item.comments.count,
                    'source' : item.link,
                    'likes' : item.likes.count,
                    'weight' : item.likes.count + item.comments.count
                },callback)
            }
        }, this);
    }
}

})(this)
