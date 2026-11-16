import type React from 'react';
import type {SceneKey} from '../config';
import {Hello} from './Hello';
import {Riviera} from './Riviera';
import {Numbers} from './Numbers';
import {Schools} from './Schools';
import {Programmes} from './Programmes';
import {LiveIt} from './LiveIt';
import {Signature} from './Signature';

export const SCENE_COMPONENTS: Record<SceneKey, React.FC> = {
  hello: Hello,
  riviera: Riviera,
  numbers: Numbers,
  schools: Schools,
  programmes: Programmes,
  liveIt: LiveIt,
  signature: Signature,
};
