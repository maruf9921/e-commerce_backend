import { Controller , Get ,Post ,Param, UseGuards, StreamableFile, Res, Header, NotFoundException, Request } from '@nestjs/common';
import { ImageUploadService } from './image-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { Role } from 'src/users/entities/role.enum';
import { Seller } from 'src/seller/entities/seller.entity';
import { Roles } from 'src/auth/roles.decorator/roles.decorator';
import { createReadStream } from 'fs';
import * as fs from 'fs';
import * as path from 'path';
import { PassThrough } from 'stream';
import { diskStorage } from 'multer';
import { Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
// import path from 'path/win32'; // Removed duplicate import

export const storage = {
        storage: diskStorage({
            destination: './uploads/images',
            filename: (req, file, cb) => {
                const filename: string = path.parse(file.originalname).name.replace(/\s/g, '')  + uuidv4();
                const extension: string = path.parse(file.originalname).ext;

                cb(null, `${filename}${extension}`);
            }
        })}

// Import the uuidv4 function from the 'uuid' package at the top of your file:
// import { v4 as uuidv4 } from 'uuid';

// Remove this function as it's not needed.
       

@Controller('image-upload')
export class ImageUploadController {

    constructor() {}
    //@UseGuards(JwtAuthGuard)
    //@Roles(Role.SELLER)
    @Post('uploads')
    @UseInterceptors(FileInterceptor('file',storage))
    uploadImage(@UploadedFile() file, @Request() req): Observable<object> {

        console.log('Uploaded file:', file);
        return of({
            imagePath: file.path,
          originalName: file.originalname,
          mimetype: file.mimetype,
          savedName: file.filename,
          path: file.path
        });

    }

    @Get('pic/:imagename')
    getImage(@Param('imagename') imagename, @Res() res): Observable<object> {

        return of(res.sendFile(join(process.cwd(), 'uploads/images/', imagename)));
    }

   /* @Get('pic/:id')
    getImageById(@Param('Id') Id: string, @Res() res): Observable<object> {

        return of(res.sendFile(join(process.cwd(), 'uploads/images/', Id)));
    }*/

   /* @Get('pic')
    getFile(): StreamableFile 
    {
        const filePath = join(process.cwd(), 'image', '1755224860078-Screenshot from 2025-06-24 01-51-42.png');
        const file = createReadStream(filePath);
        return new StreamableFile(file, {
            type: 'image/png',
            disposition: 'inline; filename="1755224860078-Screenshot from 2025-06-24 01-51-42.png"',
        });
    }*/

   /* @Get('pic/v2')
    getFileChangingResponseObjDirectjy(@Res({ passthrough: true }) res: Response): StreamableFile {
        const filePath = join(process.cwd(), 'image', '1755224860078-Screenshot from 2025-06-24 01-51-42.png');
        const file = createReadStream(filePath);
        return new StreamableFile(file, {
            type: 'image/png',
            disposition: 'inline; filename="1755224860078-Screenshot from 2025-06-24 01-51-42.png"',
        });
    }*/

   /* @Get('pic/v3')
    @Header('Content-Type', 'application/json')
    @Header('Content-Disposition', 'attachment; filename="1755224860078-Screenshot from 2025-06-24 01-51-42.png"')
    getFileUsingStaticValueHeaders(): StreamableFile {
        const filePath = join(process.cwd(), 'image', '1755224860078-Screenshot from 2025-06-24 01-51-42.png');
        const file = createReadStream(filePath);
        return new StreamableFile(file);
    }*/

   /* @Get('static/:productId')
    async getProductImage(
        @Param('productId') productId: string
    ): Promise<StreamableFile> {
            // Example: map productId to actual image filename
            // You may want to fetch filename from DB in real code
            const imageMap = {
                '5': '1755224860078-Screenshot from 2025-06-24 01-51-42.png',
                // Add more mappings as needed
            };
            const filename = imageMap[productId];
            if (!filename) {
                throw new NotFoundException('Image not found');
            }
            const filePath = join(process.cwd(), 'image', filename);
            if (!require('fs').existsSync(filePath)) {
                throw new NotFoundException('Image file not found');
            }
            const file = createReadStream(filePath);
            return new StreamableFile(file);
    }*/

}



