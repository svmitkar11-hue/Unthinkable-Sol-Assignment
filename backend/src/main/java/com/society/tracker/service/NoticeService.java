package com.society.tracker.service;

import com.society.tracker.dto.NoticeDtos.*;
import com.society.tracker.exception.ApiException;
import com.society.tracker.model.Notice;
import com.society.tracker.model.User;
import com.society.tracker.repository.NoticeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final EmailService emailService;

    public NoticeService(NoticeRepository noticeRepository, EmailService emailService) {
        this.noticeRepository = noticeRepository;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<NoticeDto> list() {
        return noticeRepository.findAllByOrderByImportantDescCreatedAtDesc()
                .stream().map(Mapper::toNoticeDto).toList();
    }

    @Transactional
    public NoticeDto create(CreateNoticeRequest req, User author) {
        Notice n = new Notice();
        n.setTitle(req.title());
        n.setBody(req.body());
        n.setImportant(req.important());
        n.setAuthor(author);
        noticeRepository.save(n);
        // Important notices email every resident.
        if (n.isImportant()) {
            emailService.sendImportantNotice(n);
        }
        return Mapper.toNoticeDto(n);
    }

    @Transactional
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw ApiException.notFound("Notice not found: " + id);
        }
        noticeRepository.deleteById(id);
    }
}
