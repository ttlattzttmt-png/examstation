/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'os';
import QRCode from 'qrcode';

export interface NetworkInfo {
  hostIp: string;
  port: number;
  lanUrl: string;
  qrCodeDataUrl: string;
  allInterfaces: Array<{ name: string; address: string; family: string }>;
}

export async function getNetworkInfo(port: number = 3000): Promise<NetworkInfo> {
  const interfaces = os.networkInterfaces();
  const allInterfaces: Array<{ name: string; address: string; family: string }> = [];
  let primaryIp = '127.0.0.1';

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;

    for (const net of netList) {
      // Skip internal and non-IPv4
      if (net.family === 'IPv4') {
        allInterfaces.push({
          name,
          address: net.address,
          family: net.family,
        });

        if (!net.internal && primaryIp === '127.0.0.1') {
          primaryIp = net.address;
        }
      }
    }
  }

  // Fallback if environment override exists
  if (process.env.APP_URL) {
    try {
      const url = new URL(process.env.APP_URL);
      if (url.hostname && url.hostname !== 'localhost') {
        // use host if valid
      }
    } catch (_) {}
  }

  const lanUrl = `http://${primaryIp}:${port}`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(lanUrl, {
      margin: 1,
      width: 250,
      color: {
        dark: '#FFD600',
        light: '#0D0D0D',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
  }

  return {
    hostIp: primaryIp,
    port,
    lanUrl,
    qrCodeDataUrl,
    allInterfaces,
  };
}
