import { Module } from '@nestjs/common';
import * as path from 'path';
import {
  AcceptLanguageResolver,
  I18nModule as NestI18nModule,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import { I18nService } from './i18n.service';
import { I18nTestController } from './i18n-test.controller';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en-US',
      loaderOptions: {
        path: path.join(__dirname, '/resources/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-lang', 'x-locale']),
        AcceptLanguageResolver,
      ],
      typesOutputPath: path.join(
        __dirname,
        '../../../generated/i18n.generated.ts',
      ),
    }),
  ],
  controllers: [I18nTestController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
