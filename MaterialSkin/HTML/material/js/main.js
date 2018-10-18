/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
 
const routes = [
    {
      path: '/',
      redirect: '/browse'
    },
    {
        path: '/browse',
        component: lmsBrowse
    },
    {
        path: '/nowplaying',
        component: lmsNowPlaying
    },
    {
        path: '/queue',
        component: lmsQueue
    }
]

let router = new VueRouter({
    routes // short for `routes: routes`
})

router.beforeEach((to, from, next) => {
    // Inform that we are about to change page (from->to) and indicate current scroll position
    // Position is required so that browse/queue can restore their current scroll on page change
    bus.$emit('routeChange', from.path, to.path, document.documentElement.scrollTop);
    next()
})

const LS_PREFIX="lms-material::";

const store = new Vuex.Store({
    state: {
        players: null, // List of players
        player: null, // Current player (from list)
        unifiedArtistsList: true,
        darkUi: true,
        artistAlbumSort:'yearalbum',
        albumSort:'album',
        autoScrollQueue:true
    },
    mutations: {
        setPlayers(state, players) {
            var changed = !state.players || state.players.length!=players.length;
            if (!changed) {
                for (i=0; i<state.players.length; ++i) {
                    var a = state.players[i];
                    var b = players[i];
                    if (a.id!=b.id || a.name!=b.name || a.canpoweroff!=b.canpoweroff ||  a.ison!=b.ison ||  a.isconnected!=b.isconnected ||  a.isgroup!=b.isgroup) {
                        changed = true;
                        break;
                    }
                }
            }

            if (!changed) {
                return;
            }

            state.players=players;
            if (state.player) {
                // Check current player is still valid
                var found = false;
                if (players) {
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].id === state.player.id) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    state.player = null;
                }
            }

            if (players && !state.player) {
                var config = localStorage.getItem(LS_PREFIX+'player');
                if (config) {
                    state.players.forEach(p => {
                        if (p.id === config) {
                            state.player = p;   
                        }
                    });
                }
                if (!state.player) { /* Choose first powered on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].ison) {
                            state.player=state.players[i];
                            localStorage.setItem(LS_PREFIX+'player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player) { /* Choose first connected on player */
                    for (i=0; i<state.players.length; ++i) {
                        if (state.players[i].isconnected) {
                            state.player=state.players[i];
                            localStorage.setItem(LS_PREFIX+'player', state.player.id);
                            break;
                        }
                    }
                }
                if (!state.player && state.players.length>0) { /* Choose first player */
                    state.player=state.players[0];
                    localStorage.setItem(LS_PREFIX+'player', state.player.id);
                }
            }
        },
        setPlayer(state, id) {
            if (state.players) {
                for (i=0; i<state.players.length; ++i) {
                    if (state.players[i].id === id) {
                        state.player = state.players[i];
                        localStorage.setItem(LS_PREFIX+'player', id);
                        break;
                    }
                }
            }
        },
        setUseUnifiedArtistsList(state, val) {
            state.unifiedArtistsList = val;
        },
        setUiSettings(state, val) {
            if (state.darkUi!=val.darkUi) {
                state.darkUi = val.darkUi;
                localStorage.setItem(LS_PREFIX+'darkUi', state.darkUi);
            }
            if (state.artistAlbumSort!=val.artistAlbumSort) {
                state.artistAlbumSort = val.artistAlbumSort;
                localStorage.setItem(LS_PREFIX+'artistAlbumSort', state.artistAlbumSort);
                bus.$emit('albumSortChanged');
            }
            if (state.albumSort!=val.albumSort) {
                state.albumSort = val.albumSort;
                localStorage.setItem(LS_PREFIX+'albumSort', state.albumSort);
                bus.$emit('albumSortChanged');
            }
            if (state.autoScrollQueue!=val.autoScrollQueue) {
                state.autoScrollQueue = val.autoScrollQueue;
                localStorage.setItem(LS_PREFIX+'autoScrollQueue', state.autoScrollQueue);
            }
        },
        initUiSettings(state) {
            var val = localStorage.getItem(LS_PREFIX+'darkUi');
            if (undefined!=val) {
                state.darkUi = true == val;
            }
            val = localStorage.getItem(LS_PREFIX+'artistAlbumSort');
            if (undefined!=val) {
                state.artistAlbumSort = val;
            }
            val = localStorage.getItem(LS_PREFIX+'albumSort');
            if (undefined!=val) {
                state.albumSort = val;
            }
            val = localStorage.getItem(LS_PREFIX+'autoScrollQueue');
            if (undefined!=val) {
                state.autoScrollQueue = true == val;
            }
        }
    }
})

Vue.use(VueLazyload);

var app = new Vue({
    el: '#app',
    data() {
        return { }
    },
    created() {
        // For testing, allow pages to be served p by (e.g.) python -m SimpleHTTPServer. Use http://localhost:8000/?lms=<reall address of LMS>
        var res = RegExp('[?&]lms=([^&#]*)').exec(window.location.href);
        if (res && 2==res.length) {
            lmsServerAddress = "http://"+res[1]+":9000";
        }
        this.$store.commit('initUiSettings');

        bus.$on('dialog', function(name, open) {
            this.dialogOpen = open;
        }.bind(this));

        var that = this;
        lmsCommand("", ["pref", "language", "?"]).then(({data}) => {
            if (data && data.result && data.result._p2) {
                var lang = data.result._p2.toLowerCase();
                if (lang != 'en') {
                    axios.get("lang/"+lang+".json").then(function (resp) {
                        setTranslation(eval(resp.data));
                        axios.defaults.headers.common['Accept-Language'] = lang;
                        document.querySelector('html').setAttribute('lang', lang);
                        bus.$emit('langChanged');
                    }).catch(err => {
                        window.console.error(err);
                    });
                }
            }
        });
    },
    computed: {
        darkUi() {
            return this.$store.state.darkUi;
        },
        lang() {
            return this.$store.state.lang;
        }
    },
    methods: {
        swipe(direction) {
            if (this.dialogOpen) {
                if ('r'==direction) {
                    console.log("CLOSE");
                    bus.$emit('closeDialog');
                }
                return;
            }
            if ('l'==direction) {
                if (this.$route.path=='/browse') {
                    this.$router.push('/nowplaying');
                } else if (this.$route.path=='/nowplaying') {
                    this.$router.push('/queue');
                } else if (this.$route.path=='/queue') {
                    this.$router.push('/browse');
                }
            } else if ('r'==direction) {
                if (this.$route.path=='/browse') {
                    this.$router.push('/queue');
                } else if (this.$route.path=='/nowplaying') {
                    this.$router.push('/browse');
                } else if (this.$route.path=='/queue') {
                    this.$router.push('/nowplaying');
                }
            }
        }
    },
    store,
    router,
    lmsServer
})

