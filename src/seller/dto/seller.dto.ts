import { match } from 'assert';
import{ IsNotEmpty, IsString, Matches, MinLength }from 'class-validator';

export class SellerDto {

    //Name validation
    @IsNotEmpty()
    @Matches(/^[a-zA-Z0-9 ]+$/, {
        message: 'Name must not contain any special characters!' ,
    })
    @IsString()
    name: string;
    
   
    //Password validation
    @IsNotEmpty()
    @MinLength(6, {
        message: 'Password must be at least 6 characters long!' ,
    })
    @Matches(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter!' ,
    })
    @IsString()
    password: string;

    //Phone number validation
    @IsNotEmpty()
    @Matches(/^01\d+$/, {
    message: 'Phone number feild must start with 01 !' ,

   })
    @IsString()
    phone: string;




}
