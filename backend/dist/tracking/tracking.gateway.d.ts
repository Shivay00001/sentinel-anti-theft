import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket, ...args: any[]): void;
    handleDisconnect(client: Socket): void;
    handleLocationUpdate(data: {
        deviceId: string;
        lat: number;
        lng: number;
        battery: number;
    }, client: Socket): {
        status: string;
    };
    handleTriggerAlarm(data: {
        deviceId: string;
    }): void;
}
