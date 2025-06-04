import { Module } from '../../../../core/server/index.js'
import { ResBackendMethodController } from './ResBackendMethodController.js'


export const resBackendMethodModule = new Module({
  key: 'resBackendMethod',
  controllers: [ResBackendMethodController],

  initApi: ()=>{
    console.info('🍪 Response methods now available via remult.res in backend methods!')
  }
})