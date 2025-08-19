import React from 'react';
import { Position } from '../services/api';
interface AccountInfoProps {
    onPositionUpdate?: (positions: Position[]) => void;
}
declare const AccountInfo: React.FC<AccountInfoProps>;
export default AccountInfo;
