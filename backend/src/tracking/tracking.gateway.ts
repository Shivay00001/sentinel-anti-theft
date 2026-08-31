import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('TrackingGateway');

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateLocation')
  handleLocationUpdate(
    @MessageBody() data: { deviceId: string; lat: number; lng: number; battery: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Location received from ${data.deviceId}: [${data.lat}, ${data.lng}]`);
    
    // Broadcast location to specific device room or dashboard
    this.server.emit(`location-update-${data.deviceId}`, data);
    
    // Here we would also push this to the AI anomaly detection engine or MongoDB
    
    return { status: 'success' };
  }

  @SubscribeMessage('triggerAlarm')
  handleTriggerAlarm(
    @MessageBody() data: { deviceId: string },
  ) {
    this.logger.log(`Alarm trigger requested for ${data.deviceId}`);
    this.server.emit(`command-${data.deviceId}`, { action: 'sound_alarm' });
  }
}
