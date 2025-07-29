import { match } from 'assert';
import{ IsString, Matches, MinLength }from 'class-validator';

export class SellerDto {

    //Name validation
    @Matches(/^[a-zA-Z0-9 ]+$/, {
        message: 'Name must not contain any special characters!' ,
    })
    @IsString()
    name: string;
    
   
    //Password validation
    @MinLength(6, {
        message: 'Password must be at least 6 characters long!' ,
    })
    @Matches(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter!' ,
    })
    password: string;

    //Phone number validation
    @Matches(/^01\d+$/, {
    message: 'Phone number feild must start with 01 !' ,

   })
    phone: string;




}
