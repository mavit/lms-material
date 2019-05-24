/**
 * LMS-Material
 *
 * Copyright (c) 2018-2019 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

Vue.component('lms-search-dialog', {
    template: `
<v-dialog scrollable v-model="show" persistent width="600">
 <v-card>
  <v-card-title>{{i18n("Search library")}}</v-card-title>
  <v-list>
   <v-list-tile>
    <v-text-field clearable v-if="show" v-model="term" class="lms-search" autofocus @keyup.enter="search()"></v-text-field>
   </v-list-tile>
   <v-list-tile>
    <v-select :items="categories" v-model="category" item-text="label" item-value="value"></v-select>
   </v-list-tile>
  </v-list>
  <v-card-actions>
   <v-spacer></v-spacer>
   <v-btn flat @click.native="cancel()">{{i18n('Cancel')}}</v-btn>
   <v-btn flat @click.native="search()">{{i18n('Search')}}</v-btn
  </v-card-actions>
 </v-card>
</v-dialog>
`,
    props: [],
    data() {
        return {
            categories: [],
            show: false,
            category: 0,
            term: ""
        }
    },
    mounted() {
        bus.$on('search.open', function() {
            this.term = "";
            this.show = true;
        }.bind(this));
        bus.$on('langChanged', function() {
            this.initItems();
        }.bind(this));
        this.initItems();
    },
    methods: {
        initItems() {
            this.categories=[ { label:i18n("All"), value: 0},
                              { label:i18n("Artists"), value: 1 },
                              { label:i18n("Albums"), value: 2 },
                              { label:i18n("Tracks"), value: 3 },
                              { label:i18n("Playlists"), value: 4 } ];
        },
        cancel() {
            this.show=false;
        },
        search() {
            var str = this.term.trim();
            if (str.length>1) {
                this.show=false;
                var title = i18n("Search:")+" "+str;
                if (0==this.category) {
                    bus.$emit('searchLib', ["search"], ["tags:jlyAdt", "extended:1", "term:"+str], title);
                } else if (1==this.category) {
                    bus.$emit('searchLib', ["artists"], ["tags:s", "search:"+str], title);
                } else if (2==this.category) {
                    bus.$emit('searchLib', ["albums"], [ALBUM_TAGS, "search:"+str], title);
                } else if (3==this.category) {
                    bus.$emit('searchLib', ["tracks"], [TRACK_TAGS, "search:"+str], title);
                } else if (4==this.category) {
                    bus.$emit('searchLib', ["playlists"], ["tags:s", "search:"+str], title);
                } else {
                    return;
                }
                this.show=false;
            }
        },
        i18n(str) {
            if (this.show) {
                return i18n(str);
            } else {
                return str;
            }
        }
    },
    watch: {
        'show': function(val) {
            bus.$emit('dialogOpen', 'search', val);
        }
    }
})
