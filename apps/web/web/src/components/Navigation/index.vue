<template>
  <v-app 
    style="font-family: Roboto, Ubuntu, Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,SimSun,sans-serif;">
    <v-navigation-drawer
      v-if='user && user.confirmed'
      v-model='drawer'
      :mini-variant.sync="mini"
      class="ufabcnext-navigation"
      app
      dark
      width="240"
      style="display: flex; flex-direction: column;">
      <div class="my-4" v-if='$vuetify.breakpoint.lgAndUp && !mini' style="padding-left: 17px;">
        <img src="@/assets/logo_white.svg" height="44" />
      </div>
      <div class="logo-minified mt-3 mb-4" v-if='mini'>
        <div class="circle elevate-3d"><img src="@/assets/next_symbol.png" height="42" /></div>
      </div>
      <v-divider></v-divider>
      <v-list
        style="flex: 1 1 auto;"
        dense
        class="mt-2">
        <v-list-tile
          v-for='(menu, i) in menus'
          :key="menu.title + menu.route"
          @click="open(menu)"
          exact>
          <v-list-tile-action style="min-width: 36px;">
            <v-icon>{{ menu.icon }}</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title class="white--text">
              {{ menu.title }}
            </v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
      <div :style="{ 'textAlign': mini ? 'center' : 'right' }" style="height: 50px;">
        <v-btn icon @click.stop="mini = !mini" v-if='!$vuetify.breakpoint.xsOnly'>
          <v-icon>{{ mini ? 'chevron_right' : 'chevron_left' }}</v-icon>
        </v-btn>
      </div>
    </v-navigation-drawer>

    <v-toolbar v-if='user && user.confirmed' color="white" class="toolbar" app dark flat :absolute="!$vuetify.breakpoint.xsOnly">
      <v-toolbar-side-icon class="primary--text hidden-lg-and-up" @click="drawer = !drawer"></v-toolbar-side-icon>
      <v-layout row flex class="title ufabcnext-grey--text hidden-md-and-down">
        Hello
      </v-layout>
      <v-layout row align-center justify-center class="flex hidden-lg-and-up">
        <img src="@/assets/logo.svg" height="32" />
      </v-layout>

      <!-- <v-layout row align-center justify-center class="flex hidden-lg-and-up"> -->
        <!-- <div class="black--text">{{ user.email}}</div> -->
      <!-- </v-layout> -->
    
      <v-menu full-width bottom left>
        <div slot="activator" class="py-2">
          <v-btn icon class="hidden-lg-and-up"><v-icon color="primary">more_vert</v-icon></v-btn>

          <!-- User information -->
          <v-layout row wrap align-center style="height: 56px" class="hidden-md-and-down">
            <v-layout justify-center column class="mr-3">
              <div class="black--text">{{ user.email}}</div>
              <div class="caption ufabcnext-lightgrey--text" v-if='user.ra'>
                RA: {{ user.ra }}
              </div>
            </v-layout>
            <v-avatar :size="38" color="primary">
              <!-- <span class="white--text">{{user.name[0]}}</span>-->
            </v-avatar>
          </v-layout>
        </div>

        <v-list dense>
          <v-layout column wrap align-center style="height: 56px" class="hidden-lg-and-up mx-3">
            <v-avatar :size="38" color="primary">
              <!-- <span class="white--text">{{user.email}}</span> -->
            </v-avatar>
            <!-- <v-layout justify-center column class="ml-3" style="width: 100%;">
              <div class="black--text">{{ user.email }}</div>
              <div class="caption ufabcnext-lightgrey--text" v-if='user.ra'>
                RA: {{ user.ra }}
              </div>
            </v-layout> -->
          </v-layout>

          <v-list-tile @click="logOut()">
            <v-list-tile-content>
              <v-list-tile-title>Sair</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-menu>
    </v-toolbar>

    <v-content style="transition: initial !important;">
      <slot></slot>
    </v-content>
  </v-app>
</template>

<script>
import Auth from '@/services/Auth'
// import Users from '@/services/Users'
import _ from 'lodash'
import Menus from '@/menus'

export default {
  name: 'Navigation',

  data() {
    return {
      navigationOpened: false,
      mini: false,
    }
  },

  computed: {
    menus() {
      // if (!this.user.permissions) return []

      return ([]).concat(Menus)//.filter(this.isAllowed)
    },

    drawer: {
      get(){
        if(this.$vuetify.breakpoint.lgAndUp) return true

        return this.navigationOpened
      },
      set(val) {
        this.navigationOpened = val
      }
    },

    currentRoute() {
      return _.get(this.$router, 'history.current', '')
    },
 
    user() {
      console.log("User", Auth.user)
      return Auth.user
    },
  },
  
  created() {
    // this.getMe()
  },

  methods: {
    // isAllowed(menu) {
    //   if(!menu.permissions) {
    //     return true
    //   }

    //   return _.castArray(menu.permissions).some(role => Auth.hasRole(role))
    // },

    logOut() {
      Auth.logOut()
    },

    open(itemMenu) {
      if(itemMenu && itemMenu.route) this.$router.push({ path: itemMenu.route, query: itemMenu.query || {} })
    },

    // async getMe() {
    //   try {
    //     let res = await Users.getMe()
    //     if(res.data) Auth.user = res.data
    //   } catch(err) {}
    // }
  }
}
</script>
<style>
.v-toolbar.toolbar {
  box-shadow: 0 2px 2px rgba(0,0,0,.03), 0 1px 0 rgba(0,0,0,.03)!important;
}
.v-toolbar--fixed.toolbar {
  z-index: 4;
}
.logo-minified {
  display: flex;
  justify-content: center;
  align-items: center;
}
.logo-minified > .circle {
  background: #fff;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 6px;
}
.logo-minified > .circle:hover {
  transform: scale(1.2);
}
.logo-minified > .circle:hover > img {
  transform: scale(0.8);
}

.logo-minified > .circle > img {
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out, -webkit-box-shadow 0.2s ease-in-out, -webkit-transform 0.2s ease-in-out;
}
.ufabcnext-navigation.v-navigation-drawer--mini-variant .v-list__tile{
  padding: 0 20px;
}
</style>