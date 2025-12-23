import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';

const FIRESTORE_APP = 'FIRESTORE';
const FIREBASE_AUTH_APP = 'FIREBASEAUTH';

@Injectable()
export class FirebaseService {
  private firestoredb?: admin.firestore.Firestore;
  private firestorage?: admin.storage.Storage;
  private fireAuth?: admin.auth.Auth;

  constructor(private readonly configService: ConfigService) {
    const firebaseConfigUrl = this.configService.get<string>('FIREBASE_CONFIG_URL');
    const firebaseAuthConfigUrl = this.configService.get<string>('FIREBASE_AUTH_CONFIG_URL');

    if (!firebaseConfigUrl || !firebaseAuthConfigUrl) {
      throw new Error('Thiếu FIREBASE_CONFIG_URL hoặc FIREBASE_AUTH_CONFIG_URL');
    }

    const firebaseConfigRaw = fs.readFileSync(firebaseConfigUrl, 'utf8');
    const firebaseAuthConfigRaw = fs.readFileSync(firebaseAuthConfigUrl, 'utf8');

    const alreadyInitialized = admin.apps.length;
    if (!alreadyInitialized) {
      admin.initializeApp(
        {
          credential: admin.credential.cert(JSON.parse(firebaseConfigRaw)),
          storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
        },
        FIRESTORE_APP,
      );

      admin.initializeApp(
        {
          credential: admin.credential.cert(JSON.parse(firebaseAuthConfigRaw)),
        },
        FIREBASE_AUTH_APP,
      );
    }

    if (admin.apps.length) {
      admin.apps.forEach((app: admin.app.App) => {
        if (app.name === FIRESTORE_APP) {
          this.firestoredb = admin.firestore(app);
          this.firestorage = admin.storage(app);
        } else if (app.name === FIREBASE_AUTH_APP) {
          this.fireAuth = admin.auth(app);
        }
      });
    }
  }

  async verifyToken(idToken: string) {
    if (!this.fireAuth) {
      throw new UnauthorizedException('Firebase Auth chưa được khởi tạo');
    }

    try {
      return await this.fireAuth.verifyIdToken(idToken);
    } catch (error) {
      throw new UnauthorizedException('Firebase token không hợp lệ');
    }
  }

  getFirestore() {
    return this.firestoredb;
  }

  getStorage() {
    return this.firestorage;
  }
}
